exports.vincentUserFacetSignatures = {
  "address": "0xa3a602f399e9663279cdf63a290101cb6560a87e",
  "methods": {
    "permitAppVersion": {
      "type": "function",
      "name": "permitAppVersion",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
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
          "name": "abilityIpfsCids",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "policyIpfsCids",
          "type": "string[][]",
          "internalType": "string[][]"
        },
        {
          "name": "policyParameterValues",
          "type": "bytes[][]",
          "internalType": "bytes[][]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "setAbilityPolicyParameters": {
      "type": "function",
      "name": "setAbilityPolicyParameters",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
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
          "name": "abilityIpfsCids",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "policyIpfsCids",
          "type": "string[][]",
          "internalType": "string[][]"
        },
        {
          "name": "policyParameterValues",
          "type": "bytes[][]",
          "internalType": "bytes[][]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "unPermitAppVersion": {
      "type": "function",
      "name": "unPermitAppVersion",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        },
        {
          "name": "appVersion",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    }
  },
  "events": [
    {
      "type": "event",
      "name": "AbilityPolicyParametersSet",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
          "name": "hashedAbilityIpfsCid",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        },
        {
          "name": "hashedAbilityPolicyIpfsCid",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        },
        {
          "name": "policyParameterValues",
          "type": "bytes",
          "indexed": false,
          "internalType": "bytes"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppVersionPermitted",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AppVersionUnPermitted",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NewUserAgentPkpRegistered",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    }
  ]
};
