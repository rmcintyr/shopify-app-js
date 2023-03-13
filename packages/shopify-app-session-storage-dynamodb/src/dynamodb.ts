
import {Session} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';

import { 
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

import { 
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: true, // false, by default.
};

const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

  export class DynamoDBSessionStorage implements SessionStorage {

  private sessionTableDefinition = {
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S"
      },
      {
        AttributeName: "shop",
        AttributeType: "S"
      }
    ],
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
    // ProvisionedThroughput: {
    //   ReadCapacityUnits: 1,
    //   WriteCapacityUnits: 1,
    // },
    TableName: "ShopifySessions",
    StreamSpecification: {
      StreamEnabled: false,
    },
    GlobalSecondaryIndexes : [{
      IndexName : "shop-index",
      KeySchema : [
        {
          AttributeName : "shop",
          KeyType : "HASH"
        }
      ],                         
      Projection : {
        ProjectionType : "ALL"
      },
      // ProvisionedThroughput : {
      //   ReadCapacityUnits: 5,
      //   WriteCapacityUnits: 1
      // }
    }]
  };

  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  

  constructor(client: DynamoDBClient, tablename: string) {
    this.client = client;
    this.docClient = DynamoDBDocumentClient.from(this.client, translateConfig);
    this.tableName = tablename
    this.init();
  }

  public async init() : Promise <boolean> {
    var command = new DescribeTableCommand({TableName: this.tableName});
    try {
      await this.client.send(command);
      return true;
    } catch (lookupErr) {
      console.warn("Unable to locate table [" + this.tableName + "]\n" + lookupErr)
      try {
        this.sessionTableDefinition.TableName = this.tableName;
        var createCommand = new CreateTableCommand(this.sessionTableDefinition);
        var createResult = await this.client.send(createCommand);
        console.info("Successfully created table [" + this.tableName + "]\n" + createResult);
        return true;
      } catch (createErr) {
        console.error("Unable to create table [" + this.tableName + "]\n" + createErr)
      }
      return false;
    }
  }

  public async storeSession(session: Session): Promise<boolean> {
    try {
      var storeCommand = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          id: session.id,
        },
        UpdateExpression: "set shop = :shop, rawSession = :rawSession",
        ExpressionAttributeValues: {
          ":shop": session.shop,
          ":rawSession": session.toPropertyArray()
        },
        ReturnValues: "ALL_NEW"
      });
      await this.docClient.send(storeCommand);
      return true;
    } catch (storeErr) {
      console.error("Unable to store session [" + this.tableName + "]\n" + storeErr)
      return false;
    }
  }

  public async loadSession(id: string): Promise<Session | undefined> {
    try {
      var getCommand = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: "" + id,
        }
      });
      const data = await this.docClient.send(getCommand);
      return Session.fromPropertyArray(data.Item.rawSession);
    } catch (loadErr) {
      console.error("Unable to load session [" + id + "] [" + this.tableName + "]\n" + loadErr)
      return undefined;
    }
  }

  public async deleteSession(id: string): Promise<boolean> {
    try {
      var deleteCommand = new DeleteCommand({
        TableName: this.tableName,
        Key: {
          id: "" + id,
        }
      });
      await this.docClient.send(deleteCommand);
      return true;
    } catch (err) {
      console.error("Unable to delete session [" + id + "] [" + this.tableName + "]\n" + err)
      return false;
    }
  }

  public async deleteSessions(ids: string[]): Promise<boolean> {
    var id;
    for ( var i = 0; i<ids.length; i++ ) {
      id = ids[i];
      try {
        await this.deleteSession(id); 
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  public async findSessionsByShop(shop: string): Promise<Session[]> {
    const sessions: Session[] = [];
    try {
      var queryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: "shop-index",
        ExpressionAttributeValues: {
          ":shop": shop
        },
        KeyConditionExpression: "shop = :shop",
      });
      const data = await this.docClient.send(queryCommand);
      for ( var i=0; i< data.Items.length; i++ ) {
        sessions.push(Session.fromPropertyArray(data.Items[i].rawSession));
      }
      return sessions;
    } catch (queryErr) {
      console.error("Unable to load sessions for shop [" + shop + "] [" + this.tableName + "]\n" + queryErr)
      return [];
    }
  }

}   