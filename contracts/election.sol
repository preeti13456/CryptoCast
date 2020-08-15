pragma solidity ^0.4.23;

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
  bytes signedBlindedVote;  // blind signature of casted vote
}
// Candidate ID mapped with candidate struct
mapping(uint => Candidate) public candidates;

// voter address mapped with voter's details and vote details
mapping(address => Voter) public voters;

// event for logging successful votes
event votedEvent(
  uint indexed _candidateId
  );
  // event for logging successful votes

event verificationSuccess();  // emits when signature is successfully verified

// event for logging successful voter registration
event newVoter(
  uint indexed _nationalID
);
// Store Candidates Count
uint public candidatesCount;   // counter cache for candidates
uint public votersCount;    // counter cache for voters

address signerAddress; // variable that keeps signer's public key for the electionb

constructor() public {
  // insert public key or signer here
  signerAddress = 0x1D6EC0e866bC2094c82f77bc40529c131b2599f7;
  addCandidate("Candidate 1");
	addCandidate("Candidate 2");

//  addVoter(100);   addvoter() function is not used in constructor statement because it invokes require(), but the contract hasn't beem created before constructor call
//  addVoter(200);
  }

// candidates are pre populated for the election (privately intitialized by the contract)
function addCandidate(string _name) private {
candidatesCount++;
candidates[candidatesCount] = Candidate(candidatesCount, _name, 0); // Candidate(ID, NAME, VOTECOUNT)
}

// anyone can register for the election
function addVoter(uint _nationalID) public {
require(voters[msg.sender].eligibility == false && voters[msg.sender].NID != _nationalID);  //checks if voter has registered before with same NID / Disallows Double Registration
votersCount++;
voters[msg.sender] = Voter(_nationalID,true,false,"");   // (NID, eligibility, hasVoted, signedBlindedVote)
emit newVoter(_nationalID);
}

function vote(uint _candidateId, bytes _blindsignature) public {

        // registered voter check
        require(voters[msg.sender].eligibility == true);

        // require that they haven't voted before
        require(!voters[msg.sender].hasVoted);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // require a valid signature
        require(signatureVerification(_candidateId,_blindsignature));

        // record that voter's verified blind signature
        voters[msg.sender].signedBlindedVote = _blindsignature;

        // record that voter has voted
        voters[msg.sender].hasVoted = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount++;

        //trigger voted event
        emit votedEvent(_candidateId);
    }

function signatureVerification(uint _candidateId, bytes memory signature) public returns (bool) {
    //  Nonce scheme can be implemented later
    // require(!usedNonces[nonce]);
    // usedNonces[nonce] = true;

            // following statement recreates the message that was signed on the client
            bytes32 message = prefixed(keccak256(abi.encodePacked(_candidateId, address(this))));

            if(recoverSigner(message, signature) == signerAddress) {
              emit verificationSuccess();    //event call
              return true;
            }
            else return false;
}

/// builds a prefixed hash to mimic the behavior of eth_sign (concatenates a prefix, message length and the message itself then hashes it)
function prefixed(bytes32 hash) internal pure returns (bytes32) {
      return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }

function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address){
      uint8 v;
      bytes32 r;
      bytes32 s;
      (v,r,s) = splitSignature(sig);
      return ecrecover(message, v, r, s);     //core function that uses ECC to recover the signer address
}
/// signature methods.
function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
      require(sig.length == 65);
      assembly {
          // first 32 bytes, after the length prefix.
          r := mload(add(sig, 32))
          // second 32 bytes.
          s := mload(add(sig, 64))
          // final byte (first byte of the next 32 bytes).
          v := byte(0, mload(add(sig, 96)))
      }
      return (v, r, s);
}

}
