import { openApi } from '@/services/openapi';

// Simple test function to verify OpenAPI integration
export const testOpenApiIntegration = async () => {
  console.log('🧪 Testing OpenAPI Integration...');

  try {
    // Test 1: Health check
    console.log('📡 Testing health endpoint...');
    const healthResponse = await openApi.auth.health();
    console.log('✅ Health check passed:', healthResponse);

    // Test 2: Fetch contracts
    console.log('📄 Testing contract fetching...');
    const contracts = await openApi.contracts.getContracts();
    console.log(`✅ Contracts fetched: ${contracts.length} contracts found`);
    console.log('📋 Contract sample:', contracts[0]);

    return {
      success: true,
      results: {
        health: healthResponse,
        contractCount: contracts.length,
        sampleContract: contracts[0]
      }
    };

  } catch (error) {
    console.error('❌ OpenAPI Integration Test Failed:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to test contract creation
export const testContractCreation = async () => {
  console.log('🧪 Testing Contract Creation...');

  try {
    const testContract = {
      title: 'Test Contract - OpenAPI Integration',
      description: 'This is a test contract created to verify OpenAPI integration',
      endDate: '2025-12-31',
      status: 'Draft' as const,
      party: [
        { partyName: 'Test Company A', partyRole: 'Client' },
        { partyName: 'Test Company B', partyRole: 'Service Provider' }
      ]
    };

    const createdContract = await openApi.contracts.createContract(testContract);
    console.log('✅ Contract created successfully:', createdContract);

    return {
      success: true,
      contract: createdContract
    };

  } catch (error) {
    console.error('❌ Contract Creation Test Failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to run all tests
export const runAllApiTests = async () => {
  console.log('🚀 Running All OpenAPI Tests...');

  const integrationTest = await testOpenApiIntegration();

  if (integrationTest.success) {
    const creationTest = await testContractCreation();
    return {
      integration: integrationTest,
      creation: creationTest
    };
  }

  return {
    integration: integrationTest,
    creation: { success: false, error: 'Skipped due to integration test failure' }
  };
};