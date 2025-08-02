
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import club from "./pages/club";
import { marketplaceAddress } from "./config";
import {Web3} from 'web3';
import $ from 'jquery'; 
import ABI from "./SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { getCurrentNetworkConfig } from './config/network';

const networkConfig = getCurrentNetworkConfig();
const web3 = new Web3(new Web3.providers.HttpProvider(networkConfig.rpcUrl));
var contractPublic = null;



  async function getContract(userAddress) {
    contractPublic = await new web3.eth.Contract(ABI.abi,marketplaceAddress);
    console.log(contractPublic)
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
  }

async function GetMyClubs() {

  function changeClub(clubId){
    localStorage.setItem('clubId', clubId);
    window.location.href = '/club';

  }


  var walletAddress = localStorage.getItem("filWalletAddress");
  await getContract(walletAddress);
  if(contractPublic != undefined) {
    var clubs = await contractPublic.methods.getMyClubs().call()
    console.log(clubs)
    if(clubs.length > 0) {

      var list = document.querySelector('.my_clubs');
      
      // Clear loading message
      list.innerHTML = '';
      
      // Create enhanced table structure
      var table = document.createElement('table');
      var thead = document.createElement('thead');
      var tbody = document.createElement('tbody');

      // Create enhanced header
      var theadTr = document.createElement('tr');
      
      var idHeader = document.createElement('th');
      idHeader.innerHTML = '<i class="fas fa-hashtag mr-1"></i>Club ID';
      idHeader.className = 'text-center';
      theadTr.appendChild(idHeader);
      
      var nameHeader = document.createElement('th');
      nameHeader.innerHTML = '<i class="fas fa-tag mr-1"></i>Club Name';
      theadTr.appendChild(nameHeader);
      
      var membersHeader = document.createElement('th');
      membersHeader.innerHTML = '<i class="fas fa-users mr-1"></i>Members';
      membersHeader.className = 'text-center';
      theadTr.appendChild(membersHeader);
      
      var proposalsHeader = document.createElement('th');
      proposalsHeader.innerHTML = '<i class="fas fa-file-alt mr-1"></i>Proposals';
      proposalsHeader.className = 'text-center';
      theadTr.appendChild(proposalsHeader);
      
      var actionsHeader = document.createElement('th');
      actionsHeader.innerHTML = '<i class="fas fa-cogs mr-1"></i>Actions';
      actionsHeader.className = 'text-center';
      theadTr.appendChild(actionsHeader);
      
      thead.appendChild(theadTr);
      thead.className = 'thead-dark';

      table.className = 'table table-hover table-striped';
      table.appendChild(thead);
      
      clubs.forEach((valor) => {
        if(valor.clubId != 0) {
          var tbodyTr = document.createElement('tr');
          tbodyTr.className = 'club-row';
          
          // Club ID column
          var idTd = document.createElement('td');
          idTd.className = 'text-center align-middle';
          var idBadge = document.createElement('span');
          idBadge.className = 'badge badge-primary badge-pill';
          idBadge.textContent = valor.clubId;
          idTd.appendChild(idBadge);
          tbodyTr.appendChild(idTd);
          
          // Club Name column
          var nameTd = document.createElement('td');
          nameTd.className = 'align-middle';
          nameTd.innerHTML = '<strong class="text-primary">' + valor.name + '</strong>';
          tbodyTr.appendChild(nameTd);
          
          // Members column
          var membersTd = document.createElement('td');
          membersTd.className = 'text-center align-middle';
          var membersBadge = document.createElement('span');
          membersBadge.className = 'badge badge-info badge-pill';
          membersBadge.innerHTML = '<i class="fas fa-users mr-1"></i>' + valor.memberCount;
          membersTd.appendChild(membersBadge);
          tbodyTr.appendChild(membersTd);
          
          // Proposals column
          var proposalsTd = document.createElement('td');
          proposalsTd.className = 'text-center align-middle';
          var proposalsBadge = document.createElement('span');
          proposalsBadge.className = 'badge badge-warning badge-pill';
          proposalsBadge.innerHTML = '<i class="fas fa-file-alt mr-1"></i>' + valor.proposalCount;
          proposalsTd.appendChild(proposalsBadge);
          tbodyTr.appendChild(proposalsTd);
          
          // Actions column
          var actionsTd = document.createElement('td');
          actionsTd.className = 'text-center align-middle';
          var viewButton = document.createElement('button');
          viewButton.className = 'btn btn-success btn-sm';
          viewButton.innerHTML = '<i class="fas fa-eye mr-1"></i>View Club';
          viewButton.addEventListener('click', function() {
            changeClub(valor.clubId);
          });
          actionsTd.appendChild(viewButton);
          tbodyTr.appendChild(actionsTd);

          tbody.appendChild(tbodyTr);
        }
      });

      table.appendChild(tbody);
      list.appendChild(table);
    }
    $('.loading_message').css('display','none');
  }
}

  export default GetMyClubs;