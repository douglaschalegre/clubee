/**
 * Executes a list of async tasks with a concurrency limit.
 *
 * @param items Array of items to process
 * @param limit Maximum number of concurrent tasks
 * @param fn Async function to execute for each item
 * @returns Promise that resolves with an array of results
 */
export async function promiseAllLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: Promise<R>[] = [];
  const executing: Set<Promise<void>> = new Set();

  for (const item of items) {
    if (executing.size >= limit) {
      await Promise.race(executing);
    }

    const p = fn(item);
    results.push(p);

    // Create a promise that resolves when p resolves or rejects
    // We catch errors here to prevent the wrapper from rejecting
    const e = p.then(() => {}).catch(() => {});

    // Create a wrapper that removes itself from the executing set when done
    const wrapper = e.then(() => {
      executing.delete(wrapper);
    });

    executing.add(wrapper);
  }

  return Promise.all(results);
}
