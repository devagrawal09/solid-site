import UpstreamRepl, { type ReplProps } from 'solid-repl';
import { compiler, formatter, linter } from './setupRepl';

type SiteReplProps = Omit<ReplProps, 'compiler' | 'formatter' | 'linter'>;

export default function Repl(props: SiteReplProps) {
  return (
    <div data-repl={props.id} class="flex flex-col flex-1 min-h-0 min-w-0 h-full">
      <UpstreamRepl
        {...props}
        compiler={compiler}
        formatter={formatter}
        linter={linter}
        version={props.version ?? __SOLID_VERSION__}
      />
    </div>
  );
}
