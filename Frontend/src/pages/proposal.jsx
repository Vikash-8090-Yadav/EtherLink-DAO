
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import $, { error } from 'jquery'; 
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { marketplaceAddress } from "../config";
import {Web3} from 'web3';
import { notification } from 'antd';
import ABI from "../SmartContract/artifacts/contracts/InvestmentClub.sol/InvestmentClub.json"
import { getCurrentNetworkConfig } from '../config/network';

import axios from 'axios';
import getProposalById from '../getProposalById';
import GetClub from '../getclub';
import Tg from "../components/toggle";

const ethers = require("ethers")

const provider = new ethers.providers.Web3Provider(window.ethereum);
const DataDaoAddress  = "0x8138489b863a68f224307a5D0Fa630917d848e25"

const networkConfig = getCurrentNetworkConfig();
const web3 = new Web3(new Web3.providers.HttpProvider(networkConfig.rpcUrl));

var contractPublic = null;

var datacontractinstance = null;


async function getContract(userAddress) {
    contractPublic = await new web3.eth.Contract(ABI.abi,marketplaceAddress);
    console.log(contractPublic)
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
  }

  var DealId = null;



async function runProposal(event) {
  try {
    var filWalletAddress = localStorage.getItem("filWalletAddress");
    await getContract(filWalletAddress);
    
    if(contractPublic == undefined) {
      toast.error("Contract not initialized");
      return;
    }

    var option_execution = $('#option_execution').val();
    
    // Input validation
    if(option_execution == '') {
      $('.errorExecution').css("display","block");
      $('.errorExecution').text("Please select an option (Execute or Close)");
      return;
    }

    var clubId = localStorage.getItem("clubId");
    var proposalId = localStorage.getItem("proposalId");
    
    if(!clubId || !proposalId) {
      toast.error("Club ID or Proposal ID not found");
      return;
    }

    // Show loading state
    $('.errorExecution').css("display","none");
    $('.successExecution').css("display","block");
    $('.successExecution').text(option_execution === 'execute' ? "Executing proposal..." : "Closing proposal...");
    
    // Check if voting is still active
    const isVotingActive = await contractPublic.methods.isVotingOn(clubId, proposalId).call();
      
    if(isVotingActive) {
      toast.error("Cannot proceed - Voting is still active");
      $('.successExecution').css("display","none");
      $('.errorExecution').css("display","block");
      $('.errorExecution').text("Voting is still active. Please wait for voting to end.");
      return;
    }

    // Get proposal details for better user feedback
    const proposal = await contractPublic.methods.getProposalById(clubId, proposalId).call();
    const proposalStatus = proposal.status;
    
    if(option_execution === 'execute') {
      // Check if proposal is already executed
      if(proposalStatus === 'Executed') {
        toast.error("Proposal is already executed");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Proposal is already executed");
        return;
      }
      
      // Check if proposal is closed
      if(proposalStatus === 'Closed') {
        toast.error("Cannot execute a closed proposal");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Cannot execute a closed proposal");
        return;
      }

      // Execute proposal
      try {
        const abi = ABI.abi;
        const iface = new ethers.utils.Interface(abi);
        const encodedData = iface.encodeFunctionData("executeProposal", [clubId, proposalId]);
        
        const signer = provider.getSigner();
        const tx = {
          to: marketplaceAddress,
          data: encodedData,
        };
        
        const txResponse = await signer.sendTransaction(tx);
        const txReceipt = await txResponse.wait();

        notification.success({
          message: 'Proposal Executed Successfully',
          description: (
            <div>
              <p>Proposal has been executed successfully!</p>
              <p>Transaction Hash: <a href={`${networkConfig.blockExplorerUrl}/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a></p>
            </div>
          )
        });

        console.log("Proposal executed:", txReceipt.transactionHash);
        
        // Clear form and show success
        $('#option_execution').val('');
        $('#passwordShowPVExecution').val('');
        $('.errorExecution').css("display","none");
        $('.successExecution').css("display","block");
        $('.successExecution').text("Proposal executed successfully!");
        
        // Refresh page after 3 seconds to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } catch(error) {
        console.error("Execute error:", error);
        toast.error("Failed to execute proposal");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Failed to execute proposal: " + error.message);
      }
      
    } else if(option_execution === 'close') {
      // Check if proposal is already closed
      if(proposalStatus === 'Closed') {
        toast.error("Proposal is already closed");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Proposal is already closed");
        return;
      }
      
      // Check if proposal is already executed
      if(proposalStatus === 'Executed') {
        toast.error("Cannot close an executed proposal");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Cannot close an executed proposal");
        return;
      }

      // Close proposal
      try {
        const abi = ABI.abi;
        const iface = new ethers.utils.Interface(abi);
        const encodedData = iface.encodeFunctionData("closeProposal", [clubId, proposalId]);
        
        const signer = provider.getSigner();
        const tx = {
          to: marketplaceAddress,
          data: encodedData,
        };
        
        const txResponse = await signer.sendTransaction(tx);
        const txReceipt = await txResponse.wait();

        notification.success({
          message: 'Proposal Closed Successfully',
          description: (
            <div>
              <p>Proposal has been closed successfully!</p>
              <p>Transaction Hash: <a href={`${networkConfig.blockExplorerUrl}/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a></p>
            </div>
          )
        });

        console.log("Proposal closed:", txReceipt.transactionHash);
        
        // Clear form and show success
        $('#option_execution').val('');
        $('#passwordShowPVExecution').val('');
        $('.errorExecution').css("display","none");
        $('.successExecution').css("display","block");
        $('.successExecution').text("Proposal closed successfully!");
        
        // Refresh page after 3 seconds to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } catch(error) {
        console.error("Close error:", error);
        toast.error("Failed to close proposal");
        $('.successExecution').css("display","none");
        $('.errorExecution').css("display","block");
        $('.errorExecution').text("Failed to close proposal: " + error.message);
      }
    }
    
  } catch (error) {
    console.error("Run proposal error:", error);
    toast.error("An error occurred");
    $('.successExecution').css("display","none");
    $('.errorExecution').css("display","block");
    $('.errorExecution').text("An error occurred: " + error.message);
  }
}

async function verify(){
  const clubId =  localStorage.getItem("clubId");
  var proposalId = localStorage.getItem("proposalId");
  var clubs = await contractPublic.methods.getProposalsByClub(clubId).call();
  console.log(clubs)
  const cid= clubs[proposalId-1].Cid;

            toast.success("Proposal data retrieved successfully", {
              position: "top-right",
              autoClose: 18000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
              });
        

}
async function voteOnProposal() {
  try {
    var filWalletAddress = localStorage.getItem("filWalletAddress");
    await getContract(filWalletAddress);
    
    if(contractPublic == undefined) {
      toast.error("Contract not initialized");
      return;
    }

    var clubId = localStorage.getItem("clubId");
    var proposalId = localStorage.getItem("proposalId");
    
    if(!clubId || !proposalId) {
      toast.error("Club ID or Proposal ID not found");
      return;
    }

    var option_vote = $('#option_vote').val();
    
    // Input validation
    if(option_vote == '') {
      $('#errorVote').css("display","block");
      $('#errorVote').text("Please select your vote (For or Against)");
      return;
    }

    // Show loading state
    $('.successVote').css("display","block");
    $('.successVote').text("Submitting vote...");
    $('.errorVote').css("display","none");
    
    var optionBool = option_vote == '1' ? true : false;
    const voteText = optionBool ? "FOR" : "AGAINST";
    
    try {
      // Check if voting is still active
      const isVotingActive = await contractPublic.methods.isVotingOn(clubId, proposalId).call();
       
      if(!isVotingActive) {
        $('.successVote').css("display","none");
        $('.errorVote').css("display","block");
        $('.errorVote').text("Voting period has ended!");
        toast.error("Voting period has ended!");
        return;
      }
      
      // Check if user has already voted
      const hasVoted = await contractPublic.methods.hasVoted(clubId, proposalId, filWalletAddress).call();
      if(hasVoted) {
        $('.successVote').css("display","none");
        $('.errorVote').css("display","block");
        $('.errorVote').text("You have already voted on this proposal");
        toast.error("You have already voted on this proposal");
        return;
      }
      
            // Submit vote
      const abi = ABI.abi;
      const iface = new ethers.utils.Interface(abi);
      const encodedData = iface.encodeFunctionData("voteOnProposal", [clubId, proposalId, optionBool]);
      
      const signer = provider.getSigner();
      const tx = {
        to: marketplaceAddress,
        data: encodedData,
      };
      
      const txResponse = await signer.sendTransaction(tx);
      const txReceipt = await txResponse.wait();

      notification.success({
        message: 'Vote Submitted Successfully',
        description: (
          <div>
            <p>Your vote ({voteText}) has been submitted successfully!</p>
            <p>Transaction Hash: <a href={`${networkConfig.blockExplorerUrl}/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a></p>
          </div>
        )
      });
      
      console.log("Vote submitted:", txReceipt.transactionHash);
      
      // Clear form and show success
      $('#option_vote').val('');
      $('.errorVote').css("display","none");
      $('.successVote').css("display","block");
      $('.successVote').text(`Your vote (${voteText}) was submitted successfully!`);
      
      // Refresh page after 3 seconds to show updated vote counts
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("Failed to submit vote");
      $('.successVote').css("display","none");
      $('.errorVote').css("display","block");
      $('.errorVote').text("Failed to submit vote: " + error.message);
    }
    
  } catch (error) {
    console.error("Vote proposal error:", error);
    toast.error("An error occurred while voting");
    $('.successVote').css("display","none");
    $('.errorVote').css("display","block");
    $('.errorVote').text("An error occurred: " + error.message);
  }
}


async function verifyUserInClub() {
  var clubId = localStorage.getItem("clubId");
  var filWalletAddress = localStorage.getItem("filWalletAddress");
  if(clubId != null) {
    await getContract(filWalletAddress);
    if(contractPublic != undefined) {
      var user = await contractPublic.methods.isMemberOfClub(filWalletAddress,clubId).call();
      if(user) {
        $('.join_club').css('display','none');
        $('.leave_club').css('display','block');
      } else {
        $('.join_club').css('display','block');
        $('.leave_club').css('display','none');
      }
    }
  }
}

function Proposal() {

  const navigate = useNavigate();
  function Logout(){
    web3.eth.accounts.wallet.clear();
    localStorage.clear();
    navigate('/login');
  
  }


    useEffect(() => {
        {
            GetClub();verifyUserInClub();getProposalById();
        }
      }, []);



  return (
    <div id="page-top">
      <style>
        {`
          .proposal-info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          
          .info-item {
            transition: all 0.3s ease;
          }
          
          .info-item:hover {
            transform: translateY(-2px);
          }
          
          .info-item label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-item .bg-light {
            border: 1px solid #e9ecef;
            transition: all 0.3s ease;
          }
          
          .info-item:hover .bg-light {
            border-color: #007bff;
            box-shadow: 0 2px 4px rgba(0,123,255,0.1);
          }
          
          .text-success {
            color: #28a745 !important;
          }
          
          .text-info {
            color: #17a2b8 !important;
          }
          
          .text-primary {
            color: #007bff !important;
          }
          
          code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
          
          .loading_message {
            color: #6c757d;
            font-style: italic;
          }
        `}
      </style>
      <>
  {/* Page Wrapper */}
  <div id="wrapper">
    {/* Sidebar */}
    <ul
      className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
      id="accordionSidebar"
    >
      {/* Sidebar - Brand */}
      <a
        className="sidebar-brand d-flex align-items-center justify-content-center"
        href="/"
      >
        <div className="sidebar-brand-icon rotate-n-15">
          <i className="fas fa-laugh-wink" />
        </div>
        <div className="sidebar-brand-text mx-3">Linea Club</div>
      </a>
      {/* Divider */}
      <hr className="sidebar-divider my-0" />
      {/* Nav Item - Dashboard */}
      <li className="nav-item active">
        <a className="nav-link" href="/">
          <i className="fas fa-fw fa-tachometer-alt" />
          <span>Dashboard</span>
        </a>
      </li>
      <li className="nav-item">
        <Link  className=" nav-link" to="joinclub">
          <i className="fas fa-fw fa-file-image-o" />
          <span>Available clubs</span>
          </Link>
        
      </li>
      <li className="nav-item">
      <Link  className="nav-link" to="/createclub">
          <i className="fas fa-fw fa-file-image-o" />
          <span>Create club</span>
        </Link>
      </li>
      {/* Divider */}
      <hr className="sidebar-divider d-none d-md-block" />
      {/* Sidebar Toggler (Sidebar) */}
      <div className="text-center d-none d-md-inline">
        <button  onClick={Tg} className="rounded-circle border-0" id="sidebarToggle" />
      </div>
    </ul>
    {/* End of Sidebar */}
    {/* Content Wrapper */}
    <div id="content-wrapper" className="d-flex flex-column">
      {/* Main Content */}
      <div id="content">
        {/* Topbar */}
        
        {/* End of Topbar */}
        {/* Begin Page Content */}
        <div className="container-fluid">
          {/* Page Heading */}
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">
              <span className="club_name" />
            </h1>
          </div>
          {/* Content Row */}
          <div className="row">
            {/* Earnings (Monthly) Card Example */}
            <div className="col-xl-2 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Club Balance (XTZ)
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800 club_balance">
                        -
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-calendar fa-2x text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-2 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Proposals
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800 club_proposals">
                        -
                      </div>
                      <a
                        href="/createproposal"
                        className="btn btn-secondary btn-sm mt-2"
                      >
                        Create
                      </a>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-calendar fa-2x text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-2 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                        Proposals{" "}
                      </div>
                      <a className="btn btn-secondary" href="/club">
                        See all proposals
                      </a>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-calendar fa-2x text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div> 

            <div className="col-xl-3 nc col-md-6 mb-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                        See All Data{" "}
                      </div>
                      
                        <div className="btn btn-primary" onClick={verify}>
                     
                       Verify Dao Data
                       </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-clipboard-list fa-2x text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* Content Row */}
          <div className="row">
            {/* Area Chart */}
            <div className="col-xl-8 col-lg-7">
              <div className="card shadow mb-4">
                {/* Card Header - Dropdown */}
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">
                    Proposal
                  </h6>
                </div>
                {/* Card Body */}
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="proposal-info-section">
                        <h6 className="font-weight-bold text-primary mb-3">
                          <i className="fas fa-file-alt mr-2"></i>
                          Proposal Details
                        </h6>
                        
                        <div className="info-item mb-3">
                          <label className="text-muted small mb-1">Description</label>
                          <div className="p-2 bg-light rounded">
                            <span className="proposal_description font-weight-bold" />
                          </div>
                        </div>
                        
                        <div className="info-item mb-3">
                          <label className="text-muted small mb-1">Amount</label>
                          <div className="p-2 bg-light rounded">
                            <span id="proposal_amount" className="font-weight-bold text-success" /> XTZ
                          </div>
                        </div>
                        
                        <div className="info-item mb-3">
                          <label className="text-muted small mb-1">Document CID</label>
                          <div className="p-2 bg-light rounded">
                            <code id="CID" className="text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="proposal-info-section">
                        <h6 className="font-weight-bold text-primary mb-3">
                          <i className="fas fa-users mr-2"></i>
                          Participants
                        </h6>
                        
                        <div className="info-item mb-3">
                          <label className="text-muted small mb-1">Creator</label>
                          <div className="p-2 bg-light rounded">
                            <span id="proposal_creator" className="font-weight-bold text-info" />
                          </div>
                        </div>
                        
                        <div className="info-item mb-3">
                          <label className="text-muted small mb-1">Destination</label>
                          <div className="p-2 bg-light rounded">
                            <span id="proposal_destination" className="font-weight-bold text-info" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="row">
                    <div className="col-md-12">
                      <h6 className="font-weight-bold text-primary mb-3">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        Voting Timeline
                      </h6>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="info-item mb-3">
                            <label className="text-muted small mb-1">Voting Started</label>
                            <div className="p-2 bg-light rounded">
                              <span id="proposedAt" className="font-weight-bold" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="info-item mb-3">
                            <label className="text-muted small mb-1">Voting Ends</label>
                            <div className="p-2 bg-light rounded">
                              <span id="proposalExpireAt" className="font-weight-bold" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row my_votes mt-3">
                    <div className="col-12">
                      <div className="loading_message text-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Loading proposal details...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Pie Chart */}
            <div className="col-xl-4 col-lg-5">
              <div
                className="card shadow mb-4 leave_club"
                style={{ display: "none" }}
              >
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <i className="fas fa-chart-pie mr-2"></i>
                    Voting Results
                  </h6>
                  <div className="mt-2">
                    <span className="badge badge-primary mr-2">
                      Status: <span id="proposal_status" />
                    </span>
                    <span className="badge badge-info" id="voting_status">
                      <i className="fas fa-clock mr-1"></i>
                      Voting Active
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="text-center">
                        <div className="h4 text-success mb-2">
                          <i className="fas fa-thumbs-up mr-2"></i>
                          <span id="votes_for">0</span>
                        </div>
                        <div className="text-muted">Votes FOR</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-center">
                        <div className="h4 text-danger mb-2">
                          <i className="fas fa-thumbs-down mr-2"></i>
                          <span id="votes_against">0</span>
                        </div>
                        <div className="text-muted">Votes AGAINST</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="progress" style={{ height: '25px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          id="votes_for_progress"
                          style={{ width: '0%' }}
                        >
                          <span className="font-weight-bold">0%</span>
                        </div>
                        <div 
                          className="progress-bar bg-danger" 
                          role="progressbar" 
                          id="votes_against_progress"
                          style={{ width: '0%' }}
                        >
                          <span className="font-weight-bold">0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="votes_available">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label htmlFor="option_vote" className="font-weight-bold text-dark">
                            Cast Your Vote:
                          </label>
                          <select id="option_vote" className="form-control">
                            <option value="">Choose your vote...</option>
                            <option value={1}>👍 Vote FOR</option>
                            <option value={0}>👎 Vote AGAINST</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mt-3">
                      <div className="col-12">
                        <button 
                          id="btnVote" 
                          onClick={() => voteOnProposal()} 
                          className="btn btn-success btn-lg btn-block"
                          style={{ fontSize: '16px', fontWeight: 'bold' }}
                        >
                          <i className="fas fa-vote-yea mr-2"></i>
                          Submit Vote
                        </button>
                      </div>
                    </div>
                    
                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="alert alert-warning">
                          <h6><i className="fas fa-exclamation-triangle mr-2"></i>Voting Rules:</h6>
                          <ul className="mb-0">
                            <li>You can only vote once per proposal</li>
                            <li>Voting is only active during the voting period</li>
                            <li>Make sure you have sufficient balance for gas fees</li>
                            <li>Your vote cannot be changed once submitted</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      className="successVote alert alert-success"
                      style={{ display: "none" }}
                    />
                    <div
                      className="errorVote alert alert-danger"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
              <div
                className="card shadow mb-4 creator_options"
                style={{ display: "none" }}
              >
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Proposal Actions</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="option_execution" className="font-weight-bold text-dark">
                          Select Action:
                        </label>
                        <select id="option_execution" className="form-control">
                          <option value="">Choose an action...</option>
                          <option value="execute">🚀 Execute Proposal</option>
                          <option value="close">❌ Close Proposal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-12">
                      <button 
                        id="btnExecution" 
                        onClick={() => runProposal()} 
                        className="btn btn-primary btn-lg btn-block"
                        style={{ fontSize: '16px', fontWeight: 'bold' }}
                      >
                        <i className="fas fa-play mr-2"></i>
                        Execute Action
                      </button>
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="alert alert-info">
                        <h6><i className="fas fa-info-circle mr-2"></i>Important Notes:</h6>
                        <ul className="mb-0">
                          <li>You can only execute/close proposals if voting has ended</li>
                          <li>Only the proposal creator can execute/close the proposal</li>
                          <li>Executed proposals cannot be closed</li>
                          <li>Closed proposals cannot be executed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className="successExecution alert alert-success"
                    style={{ display: "none" }}
                  />
                  <div
                    className="errorExecution alert alert-danger"
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Content Row */}
          <div className="row">
            <div className="col-lg-6 mb-4"></div>
          </div>
        </div>
        {/* /.container-fluid */}
      </div>
      {/* End of Main Content */}
      {/* Footer */}
      <footer className="sticky-footer bg-white"></footer>
      {/* End of Footer */}
    </div>
    {/* End of Content Wrapper */}
  </div>
  {/* End of Page Wrapper */}
  {/* Scroll to Top Button*/}
  <a className="scroll-to-top rounded" href="#page-top">
    <i className="fas fa-angle-up" />
  </a>
  {/* Logout Modal*/}
  <div
    className="modal fade"
    id="seeAccountModal"
    tabIndex={-1}
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="exampleModalLabel">
            Account
          </h5>
          <button
            className="close"
            type="button"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal-body">
          Address: <br /> <div className="current_account" />
          <br />
          <span
            style={{ fontSize: "x-small" }}
            className="current_account_text"
          />
        </div>
        <div className="modal-footer"></div>
      </div>
    </div>
  </div>
  {/* Logout Modal*/}
  <div
    className="modal fade"
    id="logoutModal"
    tabIndex={-1}
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="exampleModalLabel">
            Ready to Leave?
          </h5>
          <button
            className="close"
            type="button"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal-body">
          Select "Logout" below if you are ready to end your current session in
          this browser.
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            type="button"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <div className="btn btn-primary" onClick={Logout} id="btnLogout">
            Logout
          </div>
        </div>
      </div>
    </div>
  </div>
</>

    </div>
  )
}

// getClub();
//             verifyUserInClub();
//             getProposalById();

export default Proposal
