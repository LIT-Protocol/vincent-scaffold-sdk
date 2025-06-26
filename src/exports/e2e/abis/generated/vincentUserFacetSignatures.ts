export const vincentUserFacetSignatures = {
  "address": "0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932",
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
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "toolIpfsCids",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "policyIpfsCids",
          "type": "string[][]",
          "internalType": "string[][]"
        },
        {
          "name": "policyParameterNames",
          "type": "string[][][]",
          "internalType": "string[][][]"
        },
        {
          "name": "policyParameterValues",
          "type": "bytes[][][]",
          "internalType": "bytes[][][]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "removeToolPolicyParameters": {
      "type": "function",
      "name": "removeToolPolicyParameters",
      "inputs": [
        {
          "name": "appId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "toolIpfsCids",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "policyIpfsCids",
          "type": "string[][]",
          "internalType": "string[][]"
        },
        {
          "name": "policyParameterNames",
          "type": "string[][][]",
          "internalType": "string[][][]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    "setToolPolicyParameters": {
      "type": "function",
      "name": "setToolPolicyParameters",
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
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "toolIpfsCids",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "policyIpfsCids",
          "type": "string[][]",
          "internalType": "string[][]"
        },
        {
          "name": "policyParameterNames",
          "type": "string[][][]",
          "internalType": "string[][][]"
        },
        {
          "name": "policyParameterValues",
          "type": "bytes[][][]",
          "internalType": "bytes[][][]"
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
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    }
  },
  "events": [
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "appVersion",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
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
    },
    {
      "type": "event",
      "name": "ToolPolicyParameterRemoved",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
          "name": "hashedToolIpfsCid",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        },
        {
          "name": "hashedPolicyParameterName",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ToolPolicyParameterSet",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
          "name": "hashedToolIpfsCid",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        },
        {
          "name": "hashedPolicyParameterName",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    }
  ]
} as const;

export type VincentUserFacetSignatures = typeof vincentUserFacetSignatures;
