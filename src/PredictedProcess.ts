import type { ChildProcess ,SpawnOptions} from 'child_process';
import { spawn } from 'child_process';
export class PredictedProcess {
  private _childProcess: ChildProcess | null = null;
  private _memoizationCache: Map<string, Promise<void>> = new Map();
  private _lastSignal: AbortSignal | undefined;
  private _lastProcessPromise: Promise<void> | undefined;

  public constructor(
    public readonly id: number,
    public readonly command: string,
  ) {}

  
  public async run(signal?: AbortSignal): Promise<void> {
    if (this._childProcess && this._lastSignal !== signal) {
      throw new Error('Process is already running.');
    }

    const cacheKey = signal ? signal.toString() : 'default';
    if (this._memoizationCache.has(cacheKey)) {
      return this._memoizationCache.get(cacheKey)!;
    }

    // Check if a process is already running with the same signal
    if (this._childProcess && this._lastSignal === signal) {
      // Wait for the existing process to complete
      return this._lastProcessPromise!;
    }
    
    if (signal?.aborted) {
      throw new Error('Signal already aborted');
    }

    const options: SpawnOptions = {
      shell: true,
      stdio: 'ignore',
      detached: !signal,
    };

    const processPromise = new Promise<void>((resolve, reject) => {
      try {
        this._childProcess = spawn(this.command, options);

        const onProcessEnd = (code: number | null, error?: Error) => {
          if (this._childProcess && !this._childProcess.killed) {
            this._childProcess.kill(); // Ensure kill is called upon process completion
          }
          this._childProcess = null;
          if (error) {
            reject(error);
          } else if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process failed with exit code: ${code}`));
          }
        };

        // Handling 'exit', 'error', and 'close' events
        this._childProcess.on('exit', (code) => onProcessEnd(code));
        this._childProcess.on('error', (error) => onProcessEnd(null, error));
        this._childProcess.on('close', (code) => onProcessEnd(code));

        // ... existing abort signal handling ...

      } catch (error) {
        reject(error);
        return;
      }
    });
    this._lastSignal = signal;
    this._lastProcessPromise = processPromise;
    
    this._memoizationCache.set(cacheKey, processPromise.catch(() => {
      // Remove from cache if promise is rejected
      this._memoizationCache.delete(cacheKey);
    }));
    return processPromise;
  }

  public memoize(): PredictedProcess {
    const memoized = new PredictedProcess(this.id, this.command);
    memoized._memoizationCache = this._memoizationCache;
    return memoized;
  }
}
