export const vincentAppViewFacetSignatures = {
  "address": "0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932",
  "methods": {
    "getAppByDelegatee": {
      "type": "function",
      "name": "getAppByDelegatee",
      "inputs": [
        {
          "name": "delegatee",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "app",
          "type": "tuple",
          "internalType": "struct VincentAppViewFacet.App",
          "components": [
            {
              "name": "id",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "name",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "description",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "isDeleted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "deploymentStatus",
              "type": "uint8",
              "internalType": "enum VincentAppStorage.DeploymentStatus"
            },
            {
              "name": "manager",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "latestVersion",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
            },
            {
              "name": "authorizedRedirectUris",
              "type": "string[]",
              "internalType": "string[]"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    "getAppById": {
      "type": "function",
      "name": "getAppById",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "app",
          "type": "tuple",
          "internalType": "struct VincentAppViewFacet.App",
          "components": [
            {
              "name": "id",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "name",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "description",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "isDeleted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "deploymentStatus",
              "type": "uint8",
              "internalType": "enum VincentAppStorage.DeploymentStatus"
            },
            {
              "name": "manager",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "latestVersion",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
            },
            {
              "name": "authorizedRedirectUris",
              "type": "string[]",
              "internalType": "string[]"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    "getAppVersion": {
      "type": "function",
      "name": "getAppVersion",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "version",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "app",
          "type": "tuple",
          "internalType": "struct VincentAppViewFacet.App",
          "components": [
            {
              "name": "id",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "name",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "description",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "isDeleted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "deploymentStatus",
              "type": "uint8",
              "internalType": "enum VincentAppStorage.DeploymentStatus"
            },
            {
              "name": "manager",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "latestVersion",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
            },
            {
              "name": "authorizedRedirectUris",
              "type": "string[]",
              "internalType": "string[]"
            }
          ]
        },
        {
          "name": "appVersion",
          "type": "tuple",
          "internalType": "struct VincentAppViewFacet.AppVersion",
          "components": [
            {
              "name": "version",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "enabled",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "delegatedAgentPkpTokenIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
            },
            {
              "name": "tools",
              "type": "tuple[]",
              "internalType": "struct VincentAppViewFacet.Tool[]",
              "components": [
                {
                  "name": "toolIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "policies",
                  "type": "tuple[]",
                  "internalType": "struct VincentAppViewFacet.Policy[]",
                  "components": [
                    {
                      "name": "policyIpfsCid",
                      "type": "string",
                      "internalType": "string"
                    },
                    {
                      "name": "parameterNames",
                      "type": "string[]",
                      "internalType": "string[]"
                    },
                    {
                      "name": "parameterTypes",
                      "type": "uint8[]",
                      "internalType": "enum VincentAppStorage.ParameterType[]"
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
    "getAppsByManager": {
      "type": "function",
      "name": "getAppsByManager",
      "inputs": [
        {
          "name": "manager",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "appsWithVersions",
          "type": "tuple[]",
          "internalType": "struct VincentAppViewFacet.AppWithVersions[]",
          "components": [
            {
              "name": "app",
              "type": "tuple",
              "internalType": "struct VincentAppViewFacet.App",
              "components": [
                {
                  "name": "id",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "name",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "description",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "isDeleted",
                  "type": "bool",
                  "internalType": "bool"
                },
                {
                  "name": "deploymentStatus",
                  "type": "uint8",
                  "internalType": "enum VincentAppStorage.DeploymentStatus"
                },
                {
                  "name": "manager",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "latestVersion",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "delegatees",
                  "type": "address[]",
                  "internalType": "address[]"
                },
                {
                  "name": "authorizedRedirectUris",
                  "type": "string[]",
                  "internalType": "string[]"
                }
              ]
            },
            {
              "name": "versions",
              "type": "tuple[]",
              "internalType": "struct VincentAppViewFacet.AppVersion[]",
              "components": [
                {
                  "name": "version",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "enabled",
                  "type": "bool",
                  "internalType": "bool"
                },
                {
                  "name": "delegatedAgentPkpTokenIds",
                  "type": "uint256[]",
                  "internalType": "uint256[]"
                },
                {
                  "name": "tools",
                  "type": "tuple[]",
                  "internalType": "struct VincentAppViewFacet.Tool[]",
                  "components": [
                    {
                      "name": "toolIpfsCid",
                      "type": "string",
                      "internalType": "string"
                    },
                    {
                      "name": "policies",
                      "type": "tuple[]",
                      "internalType": "struct VincentAppViewFacet.Policy[]",
                      "components": [
                        {
                          "name": "policyIpfsCid",
                          "type": "string",
                          "internalType": "string"
                        },
                        {
                          "name": "parameterNames",
                          "type": "string[]",
                          "internalType": "string[]"
                        },
                        {
                          "name": "parameterTypes",
                          "type": "uint8[]",
                          "internalType": "enum VincentAppStorage.ParameterType[]"
                        }
                      ]
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
    "getAuthorizedRedirectUriByHash": {
      "type": "function",
      "name": "getAuthorizedRedirectUriByHash",
      "inputs": [
        {
          "name": "redirectUriHash",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "redirectUri",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    "getAuthorizedRedirectUrisByAppId": {
      "type": "function",
      "name": "getAuthorizedRedirectUrisByAppId",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "redirectUris",
          "type": "string[]",
          "internalType": "string[]"
        }
      ],
      "stateMutability": "view"
    },
    "getTotalAppCount": {
      "type": "function",
      "name": "getTotalAppCount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    }
  },
  "events": []
} as const;

export type VincentAppViewFacetSignatures = typeof vincentAppViewFacetSignatures;
