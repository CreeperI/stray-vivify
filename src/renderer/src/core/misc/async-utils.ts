// This File is copied from https://github.com/IvarK/AntimatterDimensionsSourceCode

/**
 * Async is used for making a big pile of computation into a manageable
 * set of batches that don't lock up the UI.
 * run() is the nominal entry point.
 */
interface AsyncConfig {
  maxTime: number;
  batchSize?: number;
  sleepTime?: number;
  asyncEntry?: (iterationsDone: number) => void;
  asyncProgress?: (iterationsDone: number) => void;
  asyncExit?: () => void;
  then?: () => void;
  progress?: {
    maxIter?: number;
    remaining?: number;
  };
}

type AsyncFunction = (iterationIndex: number) => void;

class AsyncRunner {
  private _enabled = true;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(val: boolean) {
    this._enabled = val;
  }

  /**
   * Runs the given function for up to `maxIter` iterations, but stops early if `maxTime` ms has elapsed.
   * @returns The number of remaining iterations not executed.
   */
  private runForTime(fun: AsyncFunction, maxIter: number, config: AsyncConfig): number {
    const batchSize = config.batchSize ?? 1;
    const maxTime = config.maxTime;
    const t0 = Date.now();
    let remaining = maxIter;

    while (remaining > 0) {
      const batch = Math.min(remaining, batchSize);
      for (let j = 0; j < batch; ++j) {
        fun(remaining - 1); // match original behavior: passes current "remaining" before decrement
        --remaining;
      }
      if (Date.now() - t0 >= maxTime) {
        return remaining;
      }
    }
    return 0;
  }

  private sleepPromise(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Asynchronously run the specified function maxIter times, letting the event loop run periodically.
   * The function is run in chunks of config.batchSize;
   * when the elapsed time reaches a specified amount, execution will pause for config.sleepTime.
   *
   * @param fun Function to run (e.g. do some computation)
   * @param maxIter Total number of times to run the function
   * @param config Options for how to do the calculation
   */
  run(fun: AsyncFunction, maxIter: number, config: AsyncConfig): Promise<void> | undefined {
    if (this.enabled) {
      // Disable async if we're already doing async
      this.enabled = false;

      const runResult = this._run(fun, maxIter, config);

      if (config.then) {
        return runResult.then(() => {
          config.then!();
          this.enabled = true;
        });
      } else {
        return runResult.then(() => {
          this.enabled = true;
        });
      }
    } else {
      // Synchronous fallback
      for (let i = 0; i < maxIter; ++i) {
        fun(i);
      }
      if (config.then) config.then();
      return undefined;
    }
  }

  /**
   * @private
   */
  private async _run(fun: AsyncFunction, maxIter: number, config: AsyncConfig): Promise<void> {
    if (!config.progress) config.progress = {};

    config.progress.maxIter = maxIter;
    config.progress.remaining = this.runForTime(fun, config.progress.maxIter, config);

    const sleepTime = config.sleepTime ?? 1;

    if (!config.progress.remaining) return;

    if (config.asyncEntry) {
      config.asyncEntry(config.progress.maxIter - config.progress.remaining);
    }

    do {
      await this.sleepPromise(sleepTime);
      config.progress.remaining = this.runForTime(fun, config.progress.remaining, config);
      if (config.asyncProgress && config.progress.maxIter !== undefined) {
        config.asyncProgress(config.progress.maxIter - config.progress.remaining);
      }
    } while (config.progress.remaining > 0);

    if (config.asyncExit) {
      config.asyncExit();
    }
  }
}

// Export singleton instance to mimic original `window.Async`
const Async = new AsyncRunner();
export default Async;

// Optional: attach to window if needed in browser environment
declare global {
  interface Window {
    Async?: typeof Async;
  }
}
if (typeof window !== 'undefined') {
  window.Async = Async;
}
