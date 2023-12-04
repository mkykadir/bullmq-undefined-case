import { BullMQWorker, Job, bullmq } from "../bullmq/index.js";
import { TaskData } from "../data/tasks.js";

export const onTimeInterval = async (job: Job<TaskData>) => {
  const { taskId, waitInMs } = job.data;

  console.info(`Time-interval received for ${taskId}, job name ${job.name}`);

  await bullmq.getQueue(BullMQWorker.Queues.TaskUpdates()).add(taskId, {
    taskId,
    waitInMs,
  });

  console.info(`Task updated ${taskId}`);
};
