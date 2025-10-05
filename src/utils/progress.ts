import ora, { Ora } from 'ora';

/**
 * Creates and starts a spinner with the given text
 * @param text The text to display next to the spinner
 * @returns The spinner instance
 */
export function startProgress(text: string): Ora {
  return ora(text).start();
}

/**
 * Updates the spinner text
 * @param spinner The spinner instance
 * @param text The new text to display
 */
export function updateProgress(spinner: Ora, text: string): void {
  spinner.text = text;
}

/**
 * Stops the spinner with a success message
 * @param spinner The spinner instance
 * @param text The success message
 */
export function successProgress(spinner: Ora, text: string): void {
  spinner.succeed(text);
}

/**
 * Stops the spinner with a failure message
 * @param spinner The spinner instance
 * @param text The failure message
 */
export function failProgress(spinner: Ora, text: string): void {
  spinner.fail(text);
}

/**
 * Shows a spinner for a promise
 * @param text The text to display
 * @param promise The promise to track
 * @param successText The text to display on success
 * @param failText The text to display on failure
 * @returns The result of the promise
 */
export async function withProgress<T>(
  text: string,
  promise: Promise<T>,
  successText: string = 'Completed successfully',
  failText: string = 'Failed'
): Promise<T> {
  const spinner = startProgress(text);
  try {
    const result = await promise;
    successProgress(spinner, successText);
    return result;
  } catch (error) {
    failProgress(spinner, failText);
    throw error;
  }
}

/**
 * Creates a progress manager for tracking multiple tasks
 * @returns An object with methods to manage multiple tasks with progress
 */
export function createMultiProgress() {
  const spinner = ora('Starting tasks...');
  let totalTasks = 0;
  let completedTasks = 0;
  let failedTasks = 0;
  
  return {
    /**
     * Start the progress tracking
     * @param text The initial text to display
     */
    start: (text: string = 'Starting tasks...') => {
      spinner.start(text);
    },
    
    /**
     * Sets the total number of tasks
     * @param count The total number of tasks
     */
    setTotal: (count: number) => {
      totalTasks = count;
      spinner.text = `0/${totalTasks} tasks completed`;
    },
    
    /**
     * Increment the completed tasks counter
     * @param successText Optional text to display for the completed task
     */
    incrementCompleted: (successText?: string) => {
      completedTasks++;
      spinner.text = `${completedTasks}/${totalTasks} tasks completed${successText ? ` - ${successText}` : ''}`;
    },
    
    /**
     * Increment the failed tasks counter
     * @param failText Optional text to display for the failed task
     */
    incrementFailed: (failText?: string) => {
      failedTasks++;
      spinner.text = `${completedTasks}/${totalTasks} tasks completed, ${failedTasks} failed${failText ? ` - ${failText}` : ''}`;
    },
    
    /**
     * Complete the progress tracking
     * @param text The final text to display
     */
    complete: (text?: string) => {
      if (failedTasks > 0) {
        spinner.fail(text || `Completed with errors: ${completedTasks}/${totalTasks} tasks completed, ${failedTasks} failed`);
      } else {
        spinner.succeed(text || `All ${totalTasks} tasks completed successfully`);
      }
    }
  };
} 