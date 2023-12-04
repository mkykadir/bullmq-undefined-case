import { BullMQWorker, Job, bullmq } from "../bullmq/index.js";
import { TaskData } from "../data/tasks.js";

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const onTaskUpdate = async (job: Job<TaskData>) => {
  const { taskId, waitInMs } = job.data;

  console.info(`Task update received for ${job.name} with taskId: ${taskId}`);

  await delay(waitInMs ?? 100);

  await bullmq.getQueue(BullMQWorker.Queues.TimeInterval()).add(
    taskId,
    {
      taskId,
      waitInMs,
    },
    {
      delay: 1_000,
    }
  );

  console.info(`Task added to time-interval queue ${taskId}`);
};
