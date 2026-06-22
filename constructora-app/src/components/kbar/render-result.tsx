import type { ComponentProps } from 'react';
import { KBarResults, useMatches } from 'kbar';
import ResultItem from './result-item';

type RenderResultState = Parameters<NonNullable<ComponentProps<typeof KBarResults>['onRender']>>[0];

function renderResult(
  { item, active }: RenderResultState,
  rootActionId: string
) {
  return typeof item === 'string' ? (
    <div className='text-muted-foreground px-4 py-2 text-sm uppercase'>{item}</div>
  ) : (
    <ResultItem action={item} active={active} currentRootActionId={rootActionId} />
  );
}

export default function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      // eslint-disable-next-line react/no-unstable-nested-components
      onRender={(state) => renderResult(state, rootActionId ?? '')}
    />
  );
}
