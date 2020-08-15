App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  signerAccount: '2417296936bbb66335c6c7b267709f39531ae5ca7427894df10a3ad7496747c9',  //demo signer's off chain private key (not present in any node) [address - 0x1D6EC0e866bC2094c82f77bc40529c131b2599f7]
  contractAddress: '0x5d080169cc2C7a570Baa4D5B096c4793723447b6',  // locally deployed demo contract Address

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {

    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
     App.listenForEvents();  // event listener call for votecasting event
    App.listenForNewVoterEvent(); // event listener call for new voter registration
      return App.render();
    });
  },

//event listener function for Vote casting
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance){
      instance.votedEvent({},{
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error,event){
        console.log("voting event triggered",event);
      })
    })
  },
  //event listener function for new Voter Registration
  listenForNewVoterEvent: function() {
      App.contracts.Election.deployed().then(function(instance){
        instance.newVoter({},{
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error,event){
          console.log("new voter event triggered",event);
        })
      })
  },

  render: function() {
  var electionInstance;
  var loader = $("#loader");
  var content = $("#content");

  loader.show();
  content.hide();
  // Load account data
  web3.eth.getCoinbase(function(err, account) {
    if (err === null) {
      App.account = account;
      $("#accountAddress").html("Your Account: " + account);
    }
  });
  //console.log("accounts[1] - " + web3.eth.accounts[1]);
  // Load contract data
  App.contracts.Election.deployed().then(function(instance) {
    electionInstance = instance;
    return electionInstance.candidatesCount();
  }).then(function(candidatesCount) {
  //  console.log(candidatesCount);
    var candidatesResults = $("#candidatesResults");
    candidatesResults.empty();

    var candidatesSelect = $('#candidatesSelect');
    candidatesSelect.empty();

    for (var i = 1; i <= candidatesCount; i++) {

      electionInstance.candidates(i).then(function(candidate) {

        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[2];

        // Render candidate Result
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        candidatesResults.append(candidateTemplate);

        // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
      });
    }
    return electionInstance.votersCount();
  }).then(function(votersCount){

    if(votersCount > 0) document.getElementById("numberOfVoters").innerHTML = votersCount;    // show current number of voters
    else document.getElementById("numberOfVoters").innerHTML = 0;

    return electionInstance.voters(App.account);
  }).then(function(voter) {

      var elligibility =  voter[1];
      var hasVoted =  voter[2];
    if(elligibility == false || (elligibility == true && hasVoted == true)) {     // Do not allow a non-voter to vote or who already have vote casted
      $('#votingForm').hide();
  //    alert("You have already voted!");
    }
    else if (elligibility == true && hasVoted == false){   //  allow voting for eligible voters
      $('#votingForm').show();
    }
    loader.hide();
    content.show();
  }).catch(function(error) {
    console.warn(error);
  });
},

castVote: function() {    // function is called  during vote casting
    var candidateId = $('#candidatesSelect').val();
    var blindSig = App.PrepareBlindVote(candidateId, App.contractAddress);
    console.log("Returned signature : " + blindSig);

    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, blindSig, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
      //Reload everything when a new vote is recorded
     App.init();
    }).catch(function(err) {
      console.error(err);
    });
  },

PrepareBlindVote: function(candidateId, contractAdd) {
    var hash = Web3.utils.soliditySha3({type: 'uint', value: candidateId}, {type: 'address', value: contractAdd}); // calculate the sha3 of given input parameters in the same way solidity would (arguments will be ABI converted and tightly packed before being hashed)

    console.log("Original HASH " + hash);
    var signature = App.signBlindVote(hash);
    console.log("HI Signature " + signature);
    return signature;
},

signBlindVote: function(hash) {
    var signObject = web3.eth.accounts.sign(hash, App.signerAccount);
    console.log("Original message " + signObject.message);
    console.log("Original messagehash " + signObject.messageHash);
    console.log("Original Signature " + signObject.signature);
    return signObject.signature;
},

createVoter: function() {   // function is called  during voter registration
      var voterNationalID = $('#voterNID').val();
      console.log(voterNationalID);
      App.contracts.Election.deployed().then(function(instance) {
        return instance.addVoter(voterNationalID, { from: App.account });
      }).then(function(result) {
        // Wait for votes to update
        $("#content").hide();
        $("#loader").show();

        //Reload everything when a new voter is created
        App.init();
      }).catch(function(err) {
        console.error(err);
      });
    }
}

  $(function() {
    $(window).load(function() {
      App.init();
    });
  });
