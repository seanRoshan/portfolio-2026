// Amazon Bedrock provider — zero-config
// Auto-reads AWS_BEARER_TOKEN_BEDROCK from environment for Bearer token auth
// Alternatively reads AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION for IAM auth
export { bedrock } from "@ai-sdk/amazon-bedrock"
