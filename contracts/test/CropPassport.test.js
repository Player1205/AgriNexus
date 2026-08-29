const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CropPassport Smart Contract", function () {
    let CropPassport, cropPassport, owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        CropPassport = await ethers.getContractFactory("CropPassport");
        cropPassport = await CropPassport.deploy();
        await cropPassport.waitForDeployment();
    });

    it("Should set the deployer as the initial owner", async function () {
        expect(await cropPassport.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to create a verified crop passport record", async function () {
        const imageHash = "0x9a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a";
        const diagnosis = "Tomato Late Blight";
        const treatmentHash = "0x1234567890abcdef1234567890abcdef12345678";
        const isSafe = true;

        const tx = await cropPassport.createPassport(imageHash, diagnosis, treatmentHash, isSafe);
        await tx.wait();

        expect(await cropPassport.nextRecordId()).to.equal(1);

        const record = await cropPassport.getPassport(0);
        expect(record.imageHash).to.equal(imageHash);
        expect(record.diagnosis).to.equal(diagnosis);
        expect(record.treatmentHash).to.equal(treatmentHash);
        expect(record.isSafe).to.equal(isSafe);
        expect(record.timestamp).to.be.gt(0);
    });

    it("Should emit PassportCreated event upon minting", async function () {
        const imageHash = "0xabcdef";
        const diagnosis = "Apple Apple Scab";
        const treatmentHash = "0x987654";
        const isSafe = true;

        await expect(cropPassport.createPassport(imageHash, diagnosis, treatmentHash, isSafe))
            .to.emit(cropPassport, "PassportCreated");
    });

    it("Should prevent non-owners from minting passports", async function () {
        const imageHash = "0xbadactor";
        const diagnosis = "Fraudulent Record";
        const treatmentHash = "0x000000";
        const isSafe = false;

        await expect(
            cropPassport.connect(addr1).createPassport(imageHash, diagnosis, treatmentHash, isSafe)
        ).to.be.revertedWithCustomError(cropPassport, "OwnableUnauthorizedAccount");
    });

    it("Should revert when querying a non-existent record ID", async function () {
        await expect(cropPassport.getPassport(999)).to.be.revertedWith("Record does not exist");
    });
});
