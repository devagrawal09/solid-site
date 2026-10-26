interface Example {
  id: string;
  name: string;
  description: string;
}

const list: Record<'Basic' | 'Complex', Example[]> = {
  Basic: [
    {
      id: 'counter',
      name: 'Counter',
      description: 'A simple standard counter example',
    },
    {
      id: 'todos',
      name: 'Simple Todos',
      description: 'Todos with LocalStorage persistence',
    },
    {
      id: 'forms',
      name: 'Form Validation',
      description: 'HTML 5 validators with custom async validation',
    },
    {
      id: 'cssanimations',
      name: 'DOM Animations',
      description: 'Animate owned elements and cancel animation handles on disposal.',
    },
    {
      id: 'context',
      name: 'Context',
      description: 'A simple color picker using Context.',
    },
    {
      id: 'styledjsx',
      name: 'Component Styles',
      description: 'Reactive CSS variables with independent component state.',
    },
    {
      id: 'counterstore',
      name: 'Shared Counter',
      description: 'A counter factory provided through a Solid 2 context.',
    },
    {
      id: 'routing',
      name: 'Hash Routing',
      description: 'Owned browser listeners and reactive route branches.',
    },
  ],
  Complex: [
    {
      id: 'clock',
      name: 'Clock',
      description: 'Demonstrates Solid reactivity with a real-time clock example.',
    },
    {
      id: 'ethasketch',
      name: 'Etch A Sketch',
      description: 'Uses position-based For and createMemo to create a grid graphic.',
    },
    {
      id: 'scoreboard',
      name: 'Scoreboard',
      description: 'Sort derived state and animate reordered rows with split effects.',
    },
    {
      id: 'asyncresource',
      name: 'Async Data',
      description: 'Async memos, initial loading, errors, and refresh.',
    },
    {
      id: 'suspensetabs',
      name: 'Pending Updates',
      description: 'Retain useful content while a newer async answer is pending.',
    },
    {
      id: 'simpletodos',
      name: 'Simple Todos Template Literals',
      description: 'Simple Todos using Lit DOM Expressions',
    },
    {
      id: 'simpletodoshyperscript',
      name: 'Simple Todos Hyperscript',
      description: 'Simple Todos using Hyper DOM Expressions',
    },
  ],
};

export const ExamplesData = () => ({
  list,
});

export type ExamplesDataRoute = ReturnType<typeof ExamplesData>;
