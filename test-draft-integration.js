// Simple test to verify useDraftState integration
const { useDraftState } = require('./lib/hooks/useDraftState');

console.log('Testing useDraftState hook...');

try {
  const draftState = useDraftState('test-league', 'test-user');
  console.log('✅ useDraftState hook loaded successfully');
  console.log('Available properties:', Object.keys(draftState));
} catch (error) {
  console.error('❌ Error loading useDraftState:', error);
}