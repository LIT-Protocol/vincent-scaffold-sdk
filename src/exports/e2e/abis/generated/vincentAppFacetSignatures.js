exports.vincentAppFacetSignatures = {
  "address": "0xa3a602f399e9663279cdf63a290101cb6560a87e",
  "methods": {
    "addDelegatee": {
      "type": "function",
      "name": "addDelegatee",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "delegatee",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "deleteApp": {
      "type": "function",
      "name": "deleteApp",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "enableAppVersion": {
      "type": "function",
      "name": "enableAppVersion",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "appVersion",
          "type": "uint24",
          "internalType": "uint24"
        },
        {
          "name": "enabled",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "registerApp": {
      "type": "function",
      "name": "registerApp",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "delegatees",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "versionAbilities",
          "type": "tuple",
          "internalType": "struct VincentAppFacet.AppVersionAbilities",
          "components": [
            {
              "name": "abilityIpfsCids",
              "type": "string[]",
              "internalType": "string[]"
            },
            {
              "name": "abilityPolicies",
              "type": "string[][]",
              "internalType": "string[][]"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "newAppVersion",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "stateMutability": "nonpayable"
    },
    "registerNextAppVersion": {
      "type": "function",
      "name": "registerNextAppVersion",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "versionAbilities",
          "type": "tuple",
          "internalType": "struct VincentAppFacet.AppVersionAbilities",
          "components": [
            {
              "name": "abilityIpfsCids",
              "type": "string[]",
              "internalType": "string[]"
            },
            {
              "name": "abilityPolicies",
              "type": "string[][]",
              "internalType": "string[][]"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "newAppVersion",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "stateMutability": "nonpayable"
    },
    "removeDelegatee": {
      "type": "function",
      "name": "removeDelegatee",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "delegatee",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "setDelegatee": {
      "type": "function",
      "name": "setDelegatee",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "delegatees",
          "type": "address[]",
          "internalType": "address[]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "undeleteApp": {
      "type": "function",
      "name": "undeleteApp",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    }
  },
  "events": [
    {
      "type": "event",
      "name": "AppDeleted",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppEnabled",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        },
        {
          "name": "appVersion",
          "type": "uint24",
          "indexed": true,
          "internalType": "uint24"
        },
        {
          "name": "enabled",
          "type": "bool",
          "indexed": true,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppUndeleted",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DelegateeAdded",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        },
        {
          "name": "delegatee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DelegateeRemoved",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        },
        {
          "name": "delegatee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NewAppRegistered",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        },
        {
          "name": "manager",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NewAppVersionRegistered",
      "inputs": [
        {
          "name": "appId",
          "type": "uint40",
          "indexed": true,
          "internalType": "uint40"
        },
        {
          "name": "appVersion",
          "type": "uint24",
          "indexed": true,
          "internalType": "uint24"
        },
        {
          "name": "manager",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NewLitActionRegistered",
      "inputs": [
        {
          "name": "litActionIpfsCidHash",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    }
  ]
};
