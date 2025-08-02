
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { marketplaceAddress } from './config';
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

window.changeProposal=(proposalId)=> {
    localStorage.setItem("proposalId",proposalId);
    console.log(localStorage.getItem("proposalId"))
    window.location.href = "proposal";
  }


  async function GetProposals() {
    function changeProposal(proposalId){
      localStorage.setItem("proposalId",proposalId);
      console.log(localStorage.getItem("proposalId"))
      window.location.href = "proposal";
    }
    var walletAddress = localStorage.getItem("filWalletAddress");
    await getContract(walletAddress);
    if(contractPublic != undefined) {
      var clubId = localStorage.getItem("clubId");
      var clubs = await contractPublic.methods.getProposalsByClub(clubId).call();
      if(clubs.length > 0) {
  
        var list = document.querySelector('.available_proposals');
      
      // Clear loading message
      list.innerHTML = '';
      
      // Create enhanced table structure
      var table = document.createElement('table');
      var thead = document.createElement('thead');
      var tbody = document.createElement('tbody');

      // Create enhanced header
      var theadTr = document.createElement('tr');
      
      var idHeader = document.createElement('th');
      idHeader.innerHTML = '<i class="fas fa-hashtag mr-1"></i>Proposal ID';
      idHeader.className = 'text-center';
      theadTr.appendChild(idHeader);
      
      var descriptionHeader = document.createElement('th');
      descriptionHeader.innerHTML = '<i class="fas fa-file-alt mr-1"></i>Description';
      theadTr.appendChild(descriptionHeader);
      
      var amountHeader = document.createElement('th');
              amountHeader.innerHTML = '<i class="fas fa-coins mr-1"></i>Amount (XTZ)';
      amountHeader.className = 'text-center';
      theadTr.appendChild(amountHeader);
      
      var statusHeader = document.createElement('th');
      statusHeader.innerHTML = '<i class="fas fa-info-circle mr-1"></i>Status';
      statusHeader.className = 'text-center';
      theadTr.appendChild(statusHeader);
      
      var actionsHeader = document.createElement('th');
      actionsHeader.innerHTML = '<i class="fas fa-cogs mr-1"></i>Actions';
      actionsHeader.className = 'text-center';
      theadTr.appendChild(actionsHeader);
      
      thead.appendChild(theadTr);
      thead.className = 'thead-dark';

      table.className = 'table table-hover table-striped';
      table.appendChild(thead);
      
      clubs.forEach((valor, clave) => {
        var tbodyTr = document.createElement('tr');
        tbodyTr.className = 'proposal-row';
        
        // Proposal ID column
        var idTd = document.createElement('td');
        idTd.className = 'text-center align-middle';
        var idBadge = document.createElement('span');
        idBadge.className = 'badge badge-primary badge-pill';
        idBadge.textContent = valor.id;
        idTd.appendChild(idBadge);
        tbodyTr.appendChild(idTd);
        
        // Description column
        var descriptionTd = document.createElement('td');
        descriptionTd.className = 'align-middle';
        descriptionTd.innerHTML = '<strong class="text-primary">' + valor.description + '</strong>';
        tbodyTr.appendChild(descriptionTd);
        
        // Amount column
        var amountTd = document.createElement('td');
        amountTd.className = 'text-center align-middle';
        var amountBadge = document.createElement('span');
        amountBadge.className = 'badge badge-success badge-pill';
        amountBadge.innerHTML = '<i class="fas fa-coins mr-1"></i>' + web3.utils.fromWei(valor.amount.toString(),'ether') + ' XTZ';
        amountTd.appendChild(amountBadge);
        tbodyTr.appendChild(amountTd);
        
        // Status column
        var statusTd = document.createElement('td');
        statusTd.className = 'text-center align-middle';
        var statusBadge = document.createElement('span');
        
        // Color code based on status
        if(valor.status === 'Executed') {
          statusBadge.className = 'badge badge-success badge-pill';
          statusBadge.innerHTML = '<i class="fas fa-check-circle mr-1"></i>' + valor.status;
        } else if(valor.status === 'Pending') {
          statusBadge.className = 'badge badge-warning badge-pill';
          statusBadge.innerHTML = '<i class="fas fa-clock mr-1"></i>' + valor.status;
        } else if(valor.status === 'Closed') {
          statusBadge.className = 'badge badge-danger badge-pill';
          statusBadge.innerHTML = '<i class="fas fa-times-circle mr-1"></i>' + valor.status;
        } else {
          statusBadge.className = 'badge badge-secondary badge-pill';
          statusBadge.innerHTML = '<i class="fas fa-question-circle mr-1"></i>' + valor.status;
        }
        
        statusTd.appendChild(statusBadge);
        tbodyTr.appendChild(statusTd);
        
        // Actions column
        var actionsTd = document.createElement('td');
        actionsTd.className = 'text-center align-middle';
        var viewButton = document.createElement('button');
        viewButton.className = 'btn btn-info btn-sm';
        viewButton.innerHTML = '<i class="fas fa-eye mr-1"></i>View Proposal';
        viewButton.addEventListener('click', function() {
          changeProposal(valor.id);
        });
        actionsTd.appendChild(viewButton);
        tbodyTr.appendChild(actionsTd);

        tbody.appendChild(tbodyTr);
      });

      table.appendChild(tbody);
      list.appendChild(table);
      }
      $('.loading_message').css('display','none');
    }
  }

export default GetProposals;
