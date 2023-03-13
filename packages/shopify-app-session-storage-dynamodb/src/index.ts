import {Session} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBSessionStorage } from './dynamodb';

var dynamoClient = new DynamoDB({apiVersion: '2012-08-10'});

var sessionStore = new DynamoDBSessionStorage(dynamoClient, "ShopifySessions");

