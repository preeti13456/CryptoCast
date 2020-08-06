pragma solidity ^0.4.2;

contract Election {
// Model a Candidate
 struct Candidate {
	uint id;
	string name;
	uint voteCount;
}
//Modle a voter
struct Voter {
  uint NID;     // govt issued national identification number of candidate
  bool eligibility;      // stores the valid list of voters during registration
  bool hasVoted;    // updates when vote is successfully casted on blockchain
  uint blindedVote;    // stores each voter's hashed vote
  uint signedBlindedVote;  // blind signature of casted vote
}
// Read/write candidates
mapping(uint => Candidate) public candidates;

// Store accounts that have voted
mapping(address => Voter) public voters;

// event for logging successful votes
event votedEvent(
  uint indexed _candidateId
  );
// Store Candidates Count
uint public candidatesCount;   // counter cache for candidates
uint public votersCount;    // counter cache for voters

constructor() public {
	addCandidate("Candidate 1");
	addCandidate("Candidate 2");
  addVoter(100);  // Null NID
  addVoter(200);
}

// candidates are pre populated for the election
function addCandidate(string _name) private {
candidatesCount++;
candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
}

// anyone can register for the election
function addVoter(uint _nationalID) public {
votersCount++;
voters[msg.sender] = Voter(_nationalID,true,false,0,0);   // (NID, eligibility, hasVoted, BlindedVote, signedBlindedVote)
}

function vote(uint _candidateId) public {

        // registered voter check
        require(voters[msg.sender].eligibility == true);

        // require that they haven't voted before
        require(!voters[msg.sender].hasVoted);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender].hasVoted = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount++;

        //trigger voted event
        emit votedEvent(_candidateId);
    }
}
