import { PredictedProcess } from './PredictedProcess';
import { PredictedProcessesManager } from './PredictedProcessesManager';

// Create instances of PredictedProcess
const process1 = new PredictedProcess(1, 'sleep 5; echo "Process 1 completed"');
const process2 = new PredictedProcess(
  2,
  'sleep 10; echo "Process 2 completed"',
);
const process3 = new PredictedProcess(
  3,
  'sleep 15; echo "Process 3 completed"',
);

// Create an instance of PredictedProcessesManager and add processes
const manager = new PredictedProcessesManager();
manager.addProcess(process1);
manager.addProcess(process2);
manager.addProcess(process3);

// Create an AbortController for managing process cancellation
const abortController = new AbortController();
const signal = abortController.signal;

// Run all processes
manager
  .runAll(signal)
  .then(() => {
    console.log('All processes have exited successfully.');
  })
  .catch((error) => {
    console.log(`An error occurred: ${error}`);
  });


// setTimeout(() => {
//   console.log('Aborting all processes.');
//   abortController.abort();
// }, 10_000); // Aborts all processes after 10 seconds

