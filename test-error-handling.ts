// Error Handling Test Suite
// This file demonstrates the enhanced error handling capabilities

import { 
  DraftErrorClass, 
  ErrorCode,
  createNetworkError, 
  createTimeoutError, 
  createValidationError,
  createDraftStateError,
  createLeagueError,
  createServerError,
  parseError,
  retryWithBackoff,
  logError 
} from '@/lib/utils/error-handling';

// Test error creation
console.log('=== Testing Error Creation ===');

// Network error
const networkError = createNetworkError('Connection failed');
console.log('Network Error:', networkError.toJSON());

// Timeout error
const timeoutError = createTimeoutError(5000);
console.log('Timeout Error:', timeoutError.toJSON());

// Validation error
const validationError = createValidationError('leagueId', 'abc');
console.log('Validation Error:', validationError.toJSON());

// Draft state error
const draftError = createDraftStateError(
  ErrorCode.NOT_YOUR_TURN, 
  "It's not your turn to pick"
);
console.log('Draft Error:', draftError.toJSON());

// League error
const leagueError = createLeagueError(
  ErrorCode.LEAGUE_FULL, 
  'League is at maximum capacity'
);
console.log('League Error:', leagueError.toJSON());

// Server error
const serverError = createServerError(503);
console.log('Server Error:', serverError.toJSON());

// Test error parsing
console.log('\n=== Testing Error Parsing ===');

// Parse standard Error
const standardError = new Error('Something went wrong');
const parsedStandard = parseError(standardError);
console.log('Parsed Standard Error:', parsedStandard.toJSON());

// Parse network error string
const networkString = 'Network request failed';
const parsedNetwork = parseError(networkString);
console.log('Parsed Network String:', parsedNetwork.toJSON());

// Parse 404 error
const notFoundError = new Error('404 - League not found');
const parsedNotFound = parseError(notFoundError);
console.log('Parsed 404 Error:', parsedNotFound.toJSON());

// Test retry with backoff
console.log('\n=== Testing Retry with Backoff ===');

let attemptCount = 0;
const failingOperation = async () => {
  attemptCount++;
  console.log(`Attempt ${attemptCount}`);
  
  if (attemptCount < 3) {
    throw createNetworkError('Simulated network failure');
  }
  
  return 'Success!';
};

retryWithBackoff(failingOperation, {
  maxAttempts: 3,
  baseDelay: 500,
  shouldRetry: (error, attempt) => error.retryable && attempt < 3
})
  .then(result => {
    console.log('Retry Result:', result);
  })
  .catch(error => {
    console.log('Retry Failed:', error.toJSON());
  });

// Test error logging
console.log('\n=== Testing Error Logging ===');

const testError = createDraftStateError(
  ErrorCode.MARKET_ALREADY_PICKED,
  'Market BTC-USD already picked by another user'
);

logError(testError, {
  component: 'DraftPage',
  action: 'makePick',
  userId: 'user-123',
  marketId: 'BTC-USD',
  timestamp: new Date().toISOString()
});

// Test error recovery
console.log('\n=== Testing Error Recovery ===');

const recoverableError = createNetworkError('Connection lost', () => {
  console.log('Executing recovery action...');
  return Promise.resolve('Recovered!');
});

console.log('Recoverable Error:', recoverableError.toJSON());
if (recoverableError.recovery) {
  recoverableError.recovery();
}

// Test error codes
console.log('\n=== Testing All Error Codes ===');

Object.values(ErrorCode).forEach(code => {
  let error;
  
  switch (code) {
    case ErrorCode.NETWORK_ERROR:
      error = createNetworkError();
      break;
    case ErrorCode.TIMEOUT_ERROR:
      error = createTimeoutError();
      break;
    case ErrorCode.INVALID_LEAGUE_ID:
      error = createValidationError('leagueId', 'invalid');
      break;
    case ErrorCode.DRAFT_NOT_FOUND:
      error = createDraftStateError(code, 'Draft not found');
      break;
    case ErrorCode.LEAGUE_FULL:
      error = createLeagueError(code, 'League is full');
      break;
    case ErrorCode.SERVER_ERROR:
      error = createServerError();
      break;
    default:
      error = new DraftErrorClass({
        code,
        message: `Test error for ${code}`,
        retryable: true,
        userMessage: `User message for ${code}`
      });
  }
  
  console.log(`${code}:`, {
    retryable: error.retryable,
    userMessage: error.userMessage
  });
});

console.log('\n=== Error Handling Test Complete ===');