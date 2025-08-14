exports.vincentAppViewFacetSignatures = {
  "address": "0xa3a602f399e9663279cdf63a290101cb6560a87e",
  "methods": {
    "APP_PAGE_SIZE": {
      "type": "function",
      "name": "APP_PAGE_SIZE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
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
              "type": "uint40",
              "internalType": "uint40"
            },
            {
              "name": "isDeleted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "manager",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "latestVersion",
              "type": "uint24",
              "internalType": "uint24"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
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
          "type": "uint40",
          "internalType": "uint40"
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
              "type": "uint40",
              "internalType": "uint40"
            },
            {
              "name": "isDeleted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "manager",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "latestVersion",
              "type": "uint24",
              "internalType": "uint24"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
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
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "version",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [
        {
          "name": "appVersion",
          "type": "tuple",
          "internalType": "struct VincentAppViewFacet.AppVersion",
          "components": [
            {
              "name": "version",
              "type": "uint24",
              "internalType": "uint24"
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
              "name": "abilities",
              "type": "tuple[]",
              "internalType": "struct VincentAppViewFacet.Ability[]",
              "components": [
                {
                  "name": "abilityIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "policyIpfsCids",
                  "type": "string[]",
                  "internalType": "string[]"
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
        },
        {
          "name": "offset",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "appIds",
          "type": "uint40[]",
          "internalType": "uint40[]"
        },
        {
          "name": "appVersionCounts",
          "type": "uint24[]",
          "internalType": "uint24[]"
        }
      ],
      "stateMutability": "view"
    },
    "getDelegatedAgentPkpTokenIds": {
      "type": "function",
      "name": "getDelegatedAgentPkpTokenIds",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "version",
          "type": "uint24",
          "internalType": "uint24"
        },
        {
          "name": "offset",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "delegatedAgentPkpTokenIds",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    }
  },
  "events": []
};
