import { createEffect } from 'solid-js';

export interface YouTubeProps {
  youTubeId: string;
}
export interface TwitchProps {
  twitchId: string;
  parent: string;
}
export interface SpotifyProps {
  spotifyLink: string;
  theme?: 'dark' | 'light';
}
export interface TweetProps {
  tweetLink: string;
  theme?: 'dark' | 'light';
  align?: 'left' | 'center' | 'right';
}

export const YouTube = (props: YouTubeProps) => (
  <iframe
    title="YouTube video"
    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(props.youTubeId)}`}
    class="w-full aspect-video border-0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  />
);

export const Twitch = (props: TwitchProps) => (
  <iframe
    title="Twitch video"
    src={`https://player.twitch.tv/?video=${encodeURIComponent(props.twitchId)}&parent=${encodeURIComponent(props.parent)}&autoplay=false`}
    class="w-full aspect-video border-0"
    loading="lazy"
    allowfullscreen
  />
);

export const Spotify = (props: SpotifyProps) => (
  <iframe
    title="Spotify player"
    src={`https://open.spotify.com/embed/${props.spotifyLink}?${props.theme === 'dark' ? 'theme=0' : ''}`}
    class="w-full border-0 rounded-xl"
    height="232"
    loading="lazy"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  />
);

interface TwitterWidgets {
  widgets: {
    createTweet(
      id: string,
      container: HTMLElement,
      options: {
        theme?: string;
        align?: string;
        dnt: boolean;
      },
    ): Promise<HTMLElement | undefined>;
  };
}

let twitter: Promise<TwitterWidgets> | undefined;
function loadTwitter() {
  return (twitter ??= new Promise<TwitterWidgets>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      const api = (window as Window & { twttr?: TwitterWidgets }).twttr;
      if (api?.widgets) resolve(api);
      else reject(new Error('Twitter widgets unavailable'));
    };
    script.onerror = () => {
      twitter = undefined;
      script.remove();
      reject(new Error('Unable to load Twitter widgets'));
    };
    document.head.append(script);
  }));
}

export function Tweet(props: TweetProps) {
  let container!: HTMLDivElement;
  createEffect(
    () => [props.tweetLink, props.theme, props.align] as const,
    ([link, theme, align]) => {
      let disposed = false;
      const target = document.createElement('div');
      container.append(target);
      void loadTwitter()
        .then((api) => {
          if (!disposed)
            return api.widgets.createTweet(link.split('/').pop()!, target, {
              theme,
              align,
              dnt: true,
            });
        })
        .catch(() => {
          /* The permanent link remains available when embeds are blocked. */
        });
      return () => {
        disposed = true;
        target.remove();
      };
    },
  );
  return (
    <div ref={container}>
      <a href={`https://twitter.com/${props.tweetLink}`} target="_blank" rel="noreferrer noopener">
        View post on X
      </a>
    </div>
  );
}
