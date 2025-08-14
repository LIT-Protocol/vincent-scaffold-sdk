const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

/**
 * Deploy Lit Action to IPFS using Pinata
 * Reads the bundled Lit Action code and deploys it to IPFS, then validates against existing metadata
 * @param {Object} options - Configuration options
 * @param {string} [options.pinataJwt] - Pinata JWT token (defaults to process.env.PINATA_JWT)
 * @param {string} [options.outputFile] - Output filename (defaults to 'lit-action.js')
 * @param {string} [options.generatedDir] - Generated directory path (defaults to '../src/generated')
 * @param {string} [options.projectType] - Project type ('ability' or 'policy') to determine metadata filename
 * @returns {Promise<string>} Promise that resolves to the IPFS CID
 */
async function deployLitAction(options = {}) {
  const {
    pinataJwt = process.env.PINATA_JWT,
    outputFile = "lit-action.js",
    generatedDir = path.join(__dirname, "../src/generated"),
    projectType = "ability",
  } = options;

  // Validate Pinata JWT
  if (!pinataJwt) {
    throw new Error(
      "❌ PINATA_JWT environment variable is not set in root .env file or provided as parameter. If you haven't got one already, you can get one from https://app.pinata.cloud, and add the JWT to your .env file."
    );
  }

  try {
    const filePath = path.join(generatedDir, outputFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `❌ Bundled Lit Action code string not found at ${filePath}. Please run pnpx nx run vincent-ability-erc20-approval:action:build first.`
      );
    }
    // Import ES module dynamically
    const litActionCodeString = await import(filePath);

    console.log(`Deploying ${outputFile} to IPFS...`);
    const ipfsCid = await uploadToIPFS(
      outputFile,
      litActionCodeString.default.code,
      pinataJwt
    );

    const metadataFilename =
      projectType === "policy"
        ? "vincent-policy-metadata.json"
        : "vincent-ability-metadata.json";
    const cidJsonPath = path.join(generatedDir, metadataFilename);

    const metadata = fs.readFileSync(cidJsonPath);
    const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);
    if (ipfsCid !== metadataIpfsCid) {
      throw new Error(
        `❌ IPFS CID mismatch in vincent-policy-metadata.json. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`
      );
    }

    console.log("✅ Successfully deployed Lit Action");
    console.log(`🔗 https://explorer.litprotocol.com/ipfs/${ipfsCid}`);

    return ipfsCid;
  } catch (error) {
    console.error("❌ Error in deploy process:", error);
    throw error;
  }
}

/**
 * Upload file content to IPFS via Pinata
 * @param {string} filename - Name of the file
 * @param {string} fileContent - Content of the file
 * @param {string} pinataJwt - Pinata JWT token
 * @returns {Promise<string>} Promise that resolves to the IPFS hash
 */
async function uploadToIPFS(filename, fileContent, pinataJwt) {
  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([fileContent], { type: "application/javascript" }),
      filename
    );

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
}

// Export the main function
module.exports = deployLitAction;

// // Run the deployment if this script is executed directly
// if (require.main === module) {
//   (async () => {
//     try {
//       await deployLitAction();
//     } catch (error) {
//       console.error("❌ Error in deploy process:", error);
//       process.exit(1);
//     }
//   })();
// }
