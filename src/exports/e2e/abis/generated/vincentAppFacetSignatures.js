exports.vincentAppFacetSignatures = {
  "address": "0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932",
  "methods": {
    "addAuthorizedRedirectUri": {
      "type": "function",
      "name": "addAuthorizedRedirectUri",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "redirectUri",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "addDelegatee": {
      "type": "function",
      "name": "addDelegatee",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
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
          "type": "uint256",
          "internalType": "uint256"
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
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "internalType": "uint256"
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
          "name": "appInfo",
          "type": "tuple",
          "internalType": "struct VincentAppFacet.AppInfo",
          "components": [
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
              "name": "deploymentStatus",
              "type": "uint8",
              "internalType": "enum VincentAppStorage.DeploymentStatus"
            },
            {
              "name": "authorizedRedirectUris",
              "type": "string[]",
              "internalType": "string[]"
            },
            {
              "name": "delegatees",
              "type": "address[]",
              "internalType": "address[]"
            }
          ]
        },
        {
          "name": "versionTools",
          "type": "tuple",
          "internalType": "struct VincentAppFacet.AppVersionTools",
          "components": [
            {
              "name": "toolIpfsCids",
              "type": "string[]",
              "internalType": "string[]"
            },
            {
              "name": "toolPolicies",
              "type": "string[][]",
              "internalType": "string[][]"
            },
            {
              "name": "toolPolicyParameterNames",
              "type": "string[][][]",
              "internalType": "string[][][]"
            },
            {
              "name": "toolPolicyParameterTypes",
              "type": "uint8[][][]",
              "internalType": "enum VincentAppStorage.ParameterType[][][]"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "newAppId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "newAppVersion",
          "type": "uint256",
          "internalType": "uint256"
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
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "versionTools",
          "type": "tuple",
          "internalType": "struct VincentAppFacet.AppVersionTools",
          "components": [
            {
              "name": "toolIpfsCids",
              "type": "string[]",
              "internalType": "string[]"
            },
            {
              "name": "toolPolicies",
              "type": "string[][]",
              "internalType": "string[][]"
            },
            {
              "name": "toolPolicyParameterNames",
              "type": "string[][][]",
              "internalType": "string[][][]"
            },
            {
              "name": "toolPolicyParameterTypes",
              "type": "uint8[][][]",
              "internalType": "enum VincentAppStorage.ParameterType[][][]"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "newAppVersion",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    "removeAuthorizedRedirectUri": {
      "type": "function",
      "name": "removeAuthorizedRedirectUri",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "redirectUri",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "removeDelegatee": {
      "type": "function",
      "name": "removeDelegatee",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
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
    "updateAppDeploymentStatus": {
      "type": "function",
      "name": "updateAppDeploymentStatus",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deploymentStatus",
          "type": "uint8",
          "internalType": "enum VincentAppStorage.DeploymentStatus"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "updateAppDescription": {
      "type": "function",
      "name": "updateAppDescription",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "newDescription",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "updateAppName": {
      "type": "function",
      "name": "updateAppName",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "newName",
          "type": "string",
          "internalType": "string"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppDeploymentStatusUpdated",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "deploymentStatus",
          "type": "uint8",
          "indexed": true,
          "internalType": "uint8"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppDescriptionUpdated",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "newDescription",
          "type": "string",
          "indexed": false,
          "internalType": "string"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
      "name": "AppNameUpdated",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "newName",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AuthorizedRedirectUriAdded",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "hashedRedirectUri",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AuthorizedRedirectUriRemoved",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "hashedRedirectUri",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
