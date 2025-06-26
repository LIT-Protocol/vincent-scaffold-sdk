export const vincentUserViewFacetSignatures = {
  "address": "0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932",
  "methods": {
    "getAllPermittedAppIdsForPkp": {
      "type": "function",
      "name": "getAllPermittedAppIdsForPkp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    "getAllRegisteredAgentPkps": {
      "type": "function",
      "name": "getAllRegisteredAgentPkps",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    "getAllToolsAndPoliciesForApp": {
      "type": "function",
      "name": "getAllToolsAndPoliciesForApp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "tools",
          "type": "tuple[]",
          "internalType": "struct VincentUserViewFacet.ToolWithPolicies[]",
          "components": [
            {
              "name": "toolIpfsCid",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "policies",
              "type": "tuple[]",
              "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
              "components": [
                {
                  "name": "policyIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "parameters",
                  "type": "tuple[]",
                  "internalType": "struct VincentUserViewFacet.PolicyParameter[]",
                  "components": [
                    {
                      "name": "name",
                      "type": "string",
                      "internalType": "string"
                    },
                    {
                      "name": "paramType",
                      "type": "uint8",
                      "internalType": "enum VincentAppStorage.ParameterType"
                    },
                    {
                      "name": "value",
                      "type": "bytes",
                      "internalType": "bytes"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    "getPermittedAppVersionForPkp": {
      "type": "function",
      "name": "getPermittedAppVersionForPkp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    "validateToolExecutionAndGetPolicies": {
      "type": "function",
      "name": "validateToolExecutionAndGetPolicies",
      "inputs": [
        {
          "name": "delegatee",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "toolIpfsCid",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "validation",
          "type": "tuple",
          "internalType": "struct VincentUserViewFacet.ToolExecutionValidation",
          "components": [
            {
              "name": "isPermitted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "appId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "appVersion",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "policies",
              "type": "tuple[]",
              "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
              "components": [
                {
                  "name": "policyIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "parameters",
                  "type": "tuple[]",
                  "internalType": "struct VincentUserViewFacet.PolicyParameter[]",
                  "components": [
                    {
                      "name": "name",
                      "type": "string",
                      "internalType": "string"
                    },
                    {
                      "name": "paramType",
                      "type": "uint8",
                      "internalType": "enum VincentAppStorage.ParameterType"
                    },
                    {
                      "name": "value",
                      "type": "bytes",
                      "internalType": "bytes"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "stateMutability": "view"
    }
  },
  "events": []
} as const;

export type VincentUserViewFacetSignatures = typeof vincentUserViewFacetSignatures;
