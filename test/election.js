var Election = artifacts.require("Election");


//functions from Mocha testing framework
contract("Election", function(accounts) {
 //variable to store value during the test time and accessible to these tests only
  var electionInstance;

  it("initializes with two candidates", function() {
    return Election.deployed().then(function(instance) {
      return instance.candidatesCount();
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });

  it("initializes with two voters", function() {
    return Election.deployed().then(function(instance) {
       electionInstance = instance;
        return electionInstance.addVoter(100,{from: accounts[1]});  // voter registration with NID-100 by 2nd account from test blockchain
    }).then(function(receipt) {        // event receipt to check if event was triggered or not
        assert.equal(receipt.logs.length,1,"an event was triggered");
        assert.equal(receipt.logs[0].event,"newVoter","the event type is correct");
        assert.equal(receipt.logs[0].args._nationalID.toNumber(),100,"the candidate id is correct");

        return electionInstance.addVoter(200,{from: accounts[2]});  // voter registration with NID-200 by 3rd account from test blockchain
      }).then(function(receipt){
        assert.equal(receipt.logs.length,1,"an event was triggered");
        assert.equal(receipt.logs[0].event,"newVoter","the event type is correct");
        assert.equal(receipt.logs[0].args._nationalID.toNumber(),200,"the candidate id is correct");
        return electionInstance.votersCount();      // check total number of voters
      }).then(function(count){
      assert.equal(count, 2, "contains the correct number of voters");
    });
  });

  it("it initializes the candidates with the correct values", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidates(1);
    }).then(function(candidate) {
      assert.equal(candidate[0], 1, "contains the correct id");
      assert.equal(candidate[1], "Candidate 1", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return electionInstance.candidates(2);
    }).then(function(candidate) {
      assert.equal(candidate[0], 2, "contains the correct id");
      assert.equal(candidate[1], "Candidate 2", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  it("it initializes the voters with the correct values", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.voters(accounts[1]);  // check 2nd account's voter info using its address
    }).then(function(voter) {         // (NID, eligibility, hasVoted, BlindedVote, signedBlindedVote)
      assert.equal(voter[0], 100, "contains the correct NID");
      assert.equal(voter[1], true, "contains the correct eligibility");
      assert.equal(voter[2], false, "contains the correct voting state");
      assert.equal(voter[3], null, "contains the correct signedBlindedVote state");
      return electionInstance.voters(accounts[2]);    // check 3rd account's voter info using its address
    }).then(function(voter) {
      assert.equal(voter[0], 200, "contains the correct NID");
      assert.equal(voter[1], true, "contains the correct eligibility");
      assert.equal(voter[2], false, "contains the correct voting state");
      assert.equal(voter[3], null, "contains the correct signedBlindedVote state");
    });
  });


// checks if a vote is casted successfully or not
it("Successful vote casting by single voter",function(){
    return Election.deployed().then(function(instance){
      electionInstance = instance;
      candidateId = 1;

      //blind signature scheme
      var hash = web3.utils.soliditySha3({type: 'uint', value: candidateId}, {type: 'address', value: '0x5d080169cc2C7a570Baa4D5B096c4793723447b6'});
      var signObject = web3.eth.accounts.sign(hash, '2417296936bbb66335c6c7b267709f39531ae5ca7427894df10a3ad7496747c9');
      var signature = signObject.signature;

      return electionInstance.vote(candidateId, signature, { from: accounts[1]});    // cast first vote
    }).then(function(receipt){
      assert.equal(receipt.logs.length,1,"an event was triggered");
      assert.equal(receipt.logs[0].event,"votedEvent","the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(),candidateId,"the candidate id is correct");
      return electionInstance.voters(accounts[1]);
    }).then(function(voter){
      assert.equal(voter[2], true, "contains the correct voting state");  // check voter struct's hasVoted value
      return electionInstance.candidates(candidateId);
    }).then(function(candidate){
      var voteCount = candidate[2];
      assert.equal(voteCount,1,"increments the candidate's vote count.");
    })
  });

  //prevents invalid candidate voting
  it("Invalid candidate voting exception", function() {
  return Election.deployed().then(function(instance) {
    electionInstance = instance;
    return electionInstance.vote(99, signature, { from: accounts[1] })   // vote with wrong candidate ID
  }).then(assert.fail).catch(function(error) {
    assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    return electionInstance.candidates(1);
  }).then(function(candidate1) {
    var voteCount = candidate1[2];
    assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
    return electionInstance.candidates(2);
  }).then(function(candidate2) {
    var voteCount = candidate2[2];
    assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
  });
});


  //prevents double voting
it("Double voting exception", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 2;
      electionInstance.vote(candidateId, '0xbac7be96787960f64841de1974ed253b67e2e6d61f0e1691a61cc855974ab145445f2497f15c1d9ce0493b564e5f68e633fc8b3430d74839c5936b4a747c63021b', { from: accounts[2] });      // vote from 3rd account on the blockchain
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "accepts first vote");   // vote is casted
      // Try to vote again
      return electionInstance.vote(candidateId,'0xbac7be96787960f64841de1974ed253b67e2e6d61f0e1691a61cc855974ab145445f2497f15c1d9ce0493b564e5f68e633fc8b3430d74839c5936b4a747c63021b', { from: accounts[2] });   //Try to vote again
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return electionInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
      return electionInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
    });
  });
});
