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
        return electionInstance.addVoter(100,{from: accounts[1]});
    }).then(function(receipt) {
        assert.equal(receipt.logs.length,1,"an event was triggered");
        assert.equal(receipt.logs[0].event,"newVoter","the event type is correct");
        assert.equal(receipt.logs[0].args._nationalID.toNumber(),100,"the candidate id is correct");

        return electionInstance.addVoter(200,{from: accounts[2]});
      }).then(function(receipt){
        assert.equal(receipt.logs.length,1,"an event was triggered");
        assert.equal(receipt.logs[0].event,"newVoter","the event type is correct");
        assert.equal(receipt.logs[0].args._nationalID.toNumber(),200,"the candidate id is correct");
        return electionInstance.votersCount();
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
      return electionInstance.voters(accounts[1]);
    }).then(function(voter) { // (NID, eligibility, hasVoted, BlindedVote, signedBlindedVote)
      assert.equal(voter[0], 100, "contains the correct NID");
      assert.equal(voter[1], true, "contains the correct eligibility");
      assert.equal(voter[2], false, "contains the correct voting state");
      assert.equal(voter[3], 0, "contains the correct BlindedVote state");
      assert.equal(voter[4], 0, "contains the correct signedBlindedVote state");
      return electionInstance.voters(accounts[2]);
    }).then(function(voter) {
      assert.equal(voter[0], 200, "contains the correct NID");
      assert.equal(voter[1], true, "contains the correct eligibility");
      assert.equal(voter[2], false, "contains the correct voting state");
      assert.equal(voter[3], 0, "contains the correct BlindedVote state");
      assert.equal(voter[4], 0, "contains the correct signedBlindedVote state");
    });
  });


// checks if a vote is casted successfully or not
it("Successful vote casting by single voter",function(){
    return Election.deployed().then(function(instance){
      electionInstance = instance;
      candidateId = 1;
      return electionInstance.vote(candidateId, { from: accounts[1]});
    }).then(function(receipt){
      assert.equal(receipt.logs.length,1,"an event was triggered");
      assert.equal(receipt.logs[0].event,"votedEvent","the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(),candidateId,"the candidate id is correct");
      return electionInstance.voters(accounts[1]);
    }).then(function(voter){
      assert.equal(voter[2], true, "contains the correct voting state");
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
    return electionInstance.vote(99, { from: accounts[1] })
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
      electionInstance.vote(candidateId, { from: accounts[2] });
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "accepts first vote");
      // Try to vote again
      return electionInstance.vote(candidateId, { from: accounts[2] });   //double voting case
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
