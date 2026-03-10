// Amazon Bedrock provider
// Auto-reads AWS_BEARER_TOKEN_BEDROCK from environment for Bearer token auth
// Alternatively reads AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for IAM auth
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock"

export const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION ?? "us-east-1",
})
