import {
  Job,
  Processor,
  Queue,
  RedisOptions,
  Worker,
  WorkerOptions,
} from "bullmq";

const redisOptions = {
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  host: process.env.REDIS_HOST ?? "localhost",
};

export class BullMQWorker {
  static readonly Queues = {
    TimeInterval: () => `bullmq:undefined:time:interval`,
    TaskUpdates: () => `bullmq:undefined:updates`,
    Repeatable: () => `bullmq:undefined:repeatable`,
  };

  static readonly JobOptions = {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: true,
  };

  readonly #redis: RedisOptions;
  readonly #queues: Map<string, Queue<any, any, any>> = new Map();
  readonly #workers: Map<string, Worker<any, any, any>> = new Map();

  constructor(redis: RedisOptions) {
    this.#redis = redis;
  }

  public create<
    DataType = any,
    ResultType = any,
    NameType extends string = string
  >(
    queueName: string,
    processor: Processor<DataType, ResultType, NameType>,
    options?: WorkerOptions
  ): { queue: Queue; worker: Worker<DataType, ResultType, NameType> } {
    const queue = this.getQueue(queueName);

    let worker = this.getWorker<DataType, ResultType, NameType>(queueName);

    if (!worker) {
      worker = new Worker(queue.name, processor, {
        connection: this.#redis,
        concurrency: 50,
        ...options,
      }) as Worker<DataType, ResultType, NameType>;

      this.#workers.set(queue.name, worker);

      worker.on("failed", (job: Job | undefined, error: Error) => {
        let taskId: string | undefined;

        if (job && job.data.taskId) {
          taskId = job.data.taskId;
        }

        console.error(
          `Worker ${queue.name} Failed for ${taskId}: ${error.message}`
        );
      });

      console.info(`BullMQ worker created for queue: ${queue.name}`);
    }

    return { queue, worker };
  }

  public getQueue<
    DataType = any,
    ResultType = any,
    NameType extends string = string
  >(name: string): Queue<DataType, ResultType, NameType> {
    let queue = this.#queues.get(name);

    if (!queue) {
      queue = new Queue<DataType, ResultType, NameType>(name, {
        connection: this.#redis,
        defaultJobOptions: BullMQWorker.JobOptions,
        streams: {
          events: {
            maxLen: 1000,
          },
        },
      });

      queue.on("error", (error: Error) => {
        console.error(`Queue ${name} Error: ${error.message}`);
      });

      this.#queues.set(queue.name, queue);

      console.info(`BullMQ queue created for queue: ${queue.name}`);
    }

    return queue;
  }

  public getWorker<
    DataType = any,
    ResultType = any,
    NameType extends string = string
  >(name: string): Worker<DataType, ResultType, NameType> | undefined {
    const worker = this.#workers.get(name);
    return worker;
  }

  public async closeAllQueues() {
    for (const [, queue] of this.#queues) {
      await queue.close();
    }
  }
}

export const bullmq = new BullMQWorker(redisOptions);

export { Job, Processor, Queue, QueueEvents, Worker } from "bullmq";
