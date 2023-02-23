const Web3 = require("web3");

const axios = require("axios");

const apikey =
  "wss://eth-goerli.g.alchemy.com/v2/WyTC0-fKskbFkdKL0PRagxvoa1MMfW3H";

const web3 = new Web3(apikey); // connect to an Ethereum node

const contractAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"; // address of the smart contract
const abi = require("./abi/boaredapeabi.json");

console.log(abi);

const contract = new web3.eth.Contract(abi, contractAddress);

contract.events.Transfer(
  {
    fromBlock: 0, // Starting block to watch for events
  },
  (error, event) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Transfer event:", event);
      console.log("Transfer event:", event.returnValues);

      GetTotalCost(event.transactionHash);
      getDetailsOfToken(event.returnValues.tokenId);
      getMetaDataOfToken();

      if (
        event.returnValues.from != "0x0000000000000000000000000000000000000000"
      )
        checkForMaliciousAdd(event.returnValues.from);

      if (event.returnValues.to != "0x0000000000000000000000000000000000000000")
        checkForMaliciousAddressOnBitCoinAbuseList(event.returnValues.to);
    }
  }
);

async function GetTotalCost(txnHash) {
  const transactionReciept = await web3.eth.getTransactionReceipt(txnHash);

  console.log("=====================================");
  console.log("Reciept ", transactionReciept);
  const { gasUsed, effectiveGasPrice } = transactionReciept;
  console.log(
    "total transaction cost ",
    transactionReciept.gasUsed,
    " effectiveGasPrice ",
    transactionReciept.effectiveGasPrice
  );
  const gasCost = gasUsed * effectiveGasPrice;

  const etherValue = Web3.utils.fromWei(gasCost.toString(), "ether");

  console.log("total transaction cost ", etherValue, "eth");
}

async function getDetailsOfToken(tokenId) {
  const tokenURI = await contract.methods.tokenURI(tokenId);
  console.log("tokenURI ", tokenURI);

  const ownerOfTokenId = await contract.methods.ownerOf(tokenId);
  console.log("ownerOfTokenId ", ownerOfTokenId);

  const nftPrice = await contract.methods.apePrice();
  console.log("nftPrice ", nftPrice);
}

async function getMetaDataOfToken() {
  // Replace with the wallet address you want to query:
  const tokenAddr = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

  var data = JSON.stringify({
    jsonrpc: "2.0",
    method: "alchemy_getTokenMetadata",
    params: [`${tokenAddr}`],
    id: 42,
  });

  var config = {
    method: "post",
    url: baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data.result, null, 2));
    })
    .catch(function (error) {
      console.log(error);
    });
}

//check for malicious addresses on etherium abuse list
async function checkForMaliciousAdd(addTockeck) {
  const address = addTockeck; // The address to check

  var config = {
    method: "get",
    url: `https://api.abuseipdb.com/api/v2/check?ethereumAddress=${address}&maxAgeInDays=90`,
    headers: {
      Key: apikey, // Replace with your API key
      Accept: "application/json",
    },
  };

  axios(config)
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.data.abuseConfidenceScore > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(
          `Abuse confidence score: ${data.data.abuseConfidenceScore}`
        );
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error));
}

//check for malicious addresses on bitcoin abuse list
async function checkForMaliciousAddressOnBitCoinAbuseList(addTockeck) {
  const address = addTockeck; // The address to check

  var config = {
    method: "get",
    url: `https://www.bitcoinabuse.com/api/reports/check?address=${address}`,
    headers: {
      Key: apikey, // Replace with your API key
      Accept: "application/json",
    },
  };

  axios(config)
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.data.abuseConfidenceScore > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(
          `Abuse confidence score: ${data.data.abuseConfidenceScore}`
        );
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error.message));
}
