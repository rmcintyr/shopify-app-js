import {batteryOfTests} from '@shopify/shopify-app-session-storage-test-utils';
import {DynamoDBSessionStorage} from '../dynamodb';
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

var dynamoClient = new DynamoDBClient({ region: "us-west-2" });

describe('DynamoDBSessionStorage', () => {
  let storage: DynamoDBSessionStorage;
  beforeAll(async () => {
    storage = new DynamoDBSessionStorage(dynamoClient, "ShopifySessions");
  });
  batteryOfTests(async () => storage);
});