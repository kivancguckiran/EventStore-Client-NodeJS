import { createInsecureTestCluster, createInsecureTestNode } from "../utils";

import { EventStoreDBClient, jsonEvent } from "../..";

describe("connectionString", () => {
  const node = createInsecureTestNode();
  const cluster = createInsecureTestCluster();

  const testEvent = () =>
    jsonEvent({ type: "test", data: { message: "test" } });

  beforeAll(async () => {
    await node.up();
    await cluster.up();
  });

  afterAll(async () => {
    await node.down();
    await cluster.down();
  });

  describe("should successfully connect with connection string", () => {
    describe("singleNode", () => {
      test("template string", async () => {
        const STREAM_NAME = "template_string_stream";
        const client = EventStoreDBClient.connectionString`esdb://${node.uri}?tls=false`;

        const appendResult = await client.appendToStream(
          STREAM_NAME,
          testEvent()
        );
        const readResult = await client.readStream(STREAM_NAME, {
          maxCount: 10,
        });

        expect(appendResult).toBeDefined();
        expect(readResult).toBeDefined();
      });

      test("string argument", async () => {
        const STREAM_NAME = "string_stream";

        const client = EventStoreDBClient.connectionString(
          `esdb://${node.uri}?tls=false`
        );

        const appendResult = await client.appendToStream(
          STREAM_NAME,
          testEvent()
        );
        const readResult = await client.readStream(STREAM_NAME, {
          maxCount: 10,
        });

        expect(appendResult).toBeDefined();
        expect(readResult).toBeDefined();
      });

      test("default credentials", async () => {
        const client = EventStoreDBClient.connectionString`esdb://admin:changeit@${node.uri}?tls=false`;
        await expect(client.readAll({ maxCount: 10 })).resolves.toBeDefined();
      });
    });

    describe("cluster", () => {
      test("template string", async () => {
        const STREAM_NAME = "template_string_stream";
        const gossipEndpoints = cluster.endpoints
          .map(({ address, port }) => `${address}:${port}`)
          .join(",");

        const client = EventStoreDBClient.connectionString`
          esdb://${gossipEndpoints}
            ?tls=false
            &nodePreference=leader
        `;

        const appendResult = await client.appendToStream(
          STREAM_NAME,
          testEvent()
        );

        const readResult = await client.readStream(STREAM_NAME, {
          maxCount: 10,
        });

        expect(appendResult).toBeDefined();
        expect(readResult).toBeDefined();
      });

      test("string argument", async () => {
        const STREAM_NAME = "string_stream";
        const gossipEndpoints = cluster.endpoints
          .map(({ address, port }) => `${address}:${port}`)
          .join(",");
        const connectionString = `esdb://${gossipEndpoints}?tls=false&nodePreference=leader`;

        const client = EventStoreDBClient.connectionString(connectionString);

        const appendResult = await client.appendToStream(
          STREAM_NAME,
          testEvent()
        );
        const readResult = await client.readStream(STREAM_NAME, {
          maxCount: 10,
        });

        expect(appendResult).toBeDefined();
        expect(readResult).toBeDefined();
      });

      test("default credentials", async () => {
        const gossipEndpoints = cluster.endpoints
          .map(({ address, port }) => `${address}:${port}`)
          .join(",");

        const client = EventStoreDBClient.connectionString`esdb://admin:changeit@${gossipEndpoints}?tls=false&nodePreference=leader`;

        await expect(client.readAll({ maxCount: 10 })).resolves.toBeDefined();
      });
    });
  });
});
