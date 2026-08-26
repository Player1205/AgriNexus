// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CropPassport
 * @dev Immutable ledger for verified agricultural disease treatments and seed validation.
 */
contract CropPassport is Ownable {
    
    struct PassportRecord {
        uint256 timestamp;
        string imageHash;
        string diagnosis;
        string treatmentHash; // Hash of the detailed treatment text
        bool isSafe;
    }

    // Mapping from record ID to PassportRecord
    mapping(uint256 => PassportRecord) public passports;
    uint256 public nextRecordId;

    event PassportCreated(uint256 indexed recordId, string imageHash, string diagnosis, bool isSafe, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new crop passport record. Only callable by the backend developer key (Owner).
     * @param _imageHash IPFS hash or SHA256 of the crop/seed image
     * @param _diagnosis Textual diagnosis (e.g., "Wheat Stripe Rust")
     * @param _treatmentHash Cryptographic hash of the chemical dosage/treatment guidance
     * @param _isSafe Boolean flag if the input was deemed safe by the deterministic C++ engine
     */
    function createPassport(
        string memory _imageHash,
        string memory _diagnosis,
        string memory _treatmentHash,
        bool _isSafe
    ) external onlyOwner returns (uint256) {
        uint256 recordId = nextRecordId++;
        
        passports[recordId] = PassportRecord({
            timestamp: block.timestamp,
            imageHash: _imageHash,
            diagnosis: _diagnosis,
            treatmentHash: _treatmentHash,
            isSafe: _isSafe
        });

        emit PassportCreated(recordId, _imageHash, _diagnosis, _isSafe, block.timestamp);
        
        return recordId;
    }

    /**
     * @dev Retrieve a passport record
     */
    function getPassport(uint256 _recordId) external view returns (PassportRecord memory) {
        require(_recordId < nextRecordId, "Record does not exist");
        return passports[_recordId];
    }
}
