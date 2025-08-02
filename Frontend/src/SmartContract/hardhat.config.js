
require ('@nomiclabs/hardhat-waffle');

task("accounts","Prints the list of the accounts",async (taskArgs , hre )=>{
  const accounts = await hre.ethers.getSigners();

  for(const account of accounts){
    console.log(account.address);
  }
})



module.exports = {
  solidity: "0.8.10",

  defaultNetwork: "Etherlink",
  networks:{
    hardhat:{},
    Etherlink: {
      url: "https://node.ghostnet.etherlink.com",
      chainId: 128123,
      accounts: ['5753e65f56865a161fbf41932a0d855139a4ce9dc20d82fb655bff393fc41702'],
    },
  }
};