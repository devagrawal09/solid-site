import type { RouteDataFactory } from '../utils/routeData';
import { createEffect, createMemo, isPending, type Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  canonicalTutorialId,
  firstTutorialId,
  getTutorial,
  tutorialDirectory,
  type LessonFiles,
  type LessonLookup,
} from '../content/tutorials';

export interface TutorialRouteData {
  loading: boolean;
  markdown?: Component;
  js?: LessonFiles;
  solvedJs?: LessonFiles;
  tutorialDirectory?: Record<string, LessonLookup[]>;
  tutorialDirectoryEntry?: LessonLookup;
  nextUrl?: string;
  previousUrl?: string;
  nextLesson?: string;
  previousLesson?: string;
  id: string;
  solved?: boolean;
}

export const TutorialData: RouteDataFactory<TutorialRouteData> = (props) => {
  const navigate = useNavigate();
  const id = () => canonicalTutorialId(props.params.id || firstTutorialId);
  const directory = () => tutorialDirectory;
  createEffect(
    () => ({ original: props.params.id, id: id(), search: props.location.search }),
    (value) => {
      if (value.original !== value.id)
        navigate(`/tutorial/${value.id}${value.search}`, { replace: true, scroll: false });
    },
  );
  const data = createMemo(() => getTutorial(id()));

  const currentIndex = (data: LessonLookup[]) => data.findIndex((el) => el.internalName === id());

  return {
    get loading() {
      return isPending(data);
    },
    get markdown() {
      return data().markdown;
    },
    get js() {
      return data().lesson;
    },
    get solvedJs() {
      return data().solved;
    },
    get tutorialDirectory() {
      const data = directory();
      if (!data) return;
      return data.reduce<Record<string, LessonLookup[]>>((sections, item) => {
        // Turns `Basics/Signal` into ['Basics', 'Signal']
        const [section, lessonName] = item.lessonName.split('/');
        // Create the section if it doesn't already exists
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push({ ...item, lessonName });
        return sections;
      }, {});
    },
    get tutorialDirectoryEntry() {
      const data = directory();
      if (!data) return;
      const entry = data.find((el) => el.internalName === id());
      return entry && { ...entry, lessonName: entry.lessonName.split('/').pop()! };
    },
    get nextUrl() {
      const data = directory();
      if (!data) return;
      const index = currentIndex(data);
      if (index + 1 < data.length) return `/tutorial/${data[index + 1].internalName}`;
    },
    get previousUrl() {
      const data = directory();
      if (!data) return;
      const index = currentIndex(data);
      if (index - 1 >= 0) return `/tutorial/${data[index - 1].internalName}`;
    },
    get nextLesson() {
      const data = directory();
      if (!data) return;
      const index = currentIndex(data);
      if (index + 1 < data.length) return data[index + 1].lessonName.split('/').pop();
    },
    get previousLesson() {
      const data = directory();
      if (!data) return;
      const index = currentIndex(data);
      if (index - 1 >= 0) return data[index - 1].lessonName.split('/').pop();
    },
    get id() {
      return id();
    },
    get solved() {
      return !!props.location.search.includes('solved');
    },
  };
};
