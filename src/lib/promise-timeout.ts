export async function withTimeout<T>(p: Promise<T>, ms = 10000, msg = "Operation timed out") {

  let timeoutId: NodeJS.Timeout;

  const timeout = new Promise<never>((_, reject) => {

    timeoutId = setTimeout(() => reject(new Error(msg)), ms);

  });

  try {

    // race the promise with the timeout

    const result = await Promise.race([p, timeout]);

    // @ts-expect-error timeoutId will be assigned

    clearTimeout(timeoutId);

    return result as T;

  } finally {

    // @ts-expect-error defensive clear

    clearTimeout(timeoutId!);

  }

}

