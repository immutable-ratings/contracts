import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ImmutableMapping, ImmutableMapping__factory } from "../../types";

describe("Immutable Ratings", () => {
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let alice: SignerWithAddress;

  let mapping: ImmutableMapping;
  let mappingFactory: ImmutableMapping__factory;

  // Example based on the original implementation
  const knownOrigin = "https://www.ratings.wtf";
  const knownIdentity = "0x4cAF50D10399FB59c024b9FcC6CCc986bBF56321";
  const seed = "Immutable_Ratings_by_GM_EB_MB";

  before(async () => {
    const signers = await ethers.getSigners();

    [deployer, receiver, alice] = signers as [SignerWithAddress, SignerWithAddress, SignerWithAddress];
  });

  const deploy = async () => {
    mappingFactory = await ethers.getContractFactory("ImmutableMapping");
    mapping = await mappingFactory.deploy();
    await mapping.waitForDeployment();
  };

  beforeEach(async () => {
    await loadFixture(deploy);
  });

  describe("Deployment", () => {
    it("should deploy the contract", async () => {
      expect(await mapping.SEED()).to.equal(seed);
    });
  });

  describe("createMapping", () => {
    it("should create a mapping", async () => {
      await mapping.createMapping(knownOrigin);
      expect(await mapping.addressOf(knownOrigin)).to.equal(knownIdentity);
    });

    it("should return the address of the mapping", async () => {
      const address = await mapping.createMapping.staticCall(knownOrigin);
      expect(address).to.equal(knownIdentity);
    });

    it("should revert if the origin is already mapped", async () => {
      await mapping.createMapping(knownOrigin);
      await expect(mapping.createMapping(knownOrigin)).to.be.revertedWithCustomError(mapping, "AlreadyMapped");
    });
  });

  describe("createMappingFor", () => {
    it("should create a mapping for a specific creator", async () => {
      await mapping.createMappingFor(knownOrigin, alice.address);
      expect(await mapping.creatorOf(knownIdentity)).to.equal(alice.address);
    });

    it("should return the address of the mapping", async () => {
      const address = await mapping.createMappingFor.staticCall(knownOrigin, alice.address);
      expect(address).to.equal(knownIdentity);
    });

    it("should revert if the origin is already mapped", async () => {
      await mapping.createMappingFor(knownOrigin, alice.address);
      await expect(mapping.createMappingFor(knownOrigin, alice.address)).to.be.revertedWithCustomError(
        mapping,
        "AlreadyMapped",
      );
    });

    it("should revert if the creator is the zero address", async () => {
      await expect(mapping.createMappingFor(knownOrigin, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        mapping,
        "ZeroAddress",
      );
    });
  });

  describe("previewIdentity", () => {
    it("should return the identity for a known origin", async () => {
      expect(await mapping.previewAddress(knownOrigin)).to.equal(knownIdentity);
    });

    it("should revert if the origin is empty", async () => {
      await expect(mapping.previewAddress("")).to.be.revertedWithCustomError(mapping, "EmptyOrigin");
    });
  });

  describe("isOriginMapped", () => {
    it("should return true if the origin is mapped", async () => {
      expect(await mapping.isOriginMapped(knownOrigin)).to.equal(false);
      await mapping.createMapping(knownOrigin);
      expect(await mapping.isOriginMapped(knownOrigin)).to.equal(true);
    });
  });

  describe("identityOf", () => {
    it("should return the identity for a known origin", async () => {
      await mapping.createMapping(knownOrigin);
      expect(await mapping.addressOf(knownOrigin)).to.equal(knownIdentity);
    });

    it("should revert if the origin is not mapped", async () => {
      await expect(mapping.addressOf(knownOrigin)).to.be.revertedWithCustomError(mapping, "OriginNotMapped");
    });
  });

  describe("originOf", () => {
    it("should return the origin for a known identity", async () => {
      await mapping.createMapping(knownOrigin);
      expect(await mapping.originOf(knownIdentity)).to.equal(knownOrigin);
    });

    it("should revert if the identity is not mapped", async () => {
      await expect(mapping.originOf(knownIdentity)).to.be.revertedWithCustomError(mapping, "AddressNotMapped");
    });
  });

  describe("identityCreatorOf", () => {
    it("should return the creator for a known identity", async () => {
      await mapping.createMappingFor(knownOrigin, alice.address);
      expect(await mapping.creatorOf(knownIdentity)).to.equal(alice.address);
    });

    it("should revert if the identity is not mapped", async () => {
      await expect(mapping.creatorOf(knownIdentity)).to.be.revertedWithCustomError(mapping, "AddressNotMapped");
    });
  });

  describe("originCreatorOf", () => {
    it("should return the creator for a known origin", async () => {
      await mapping.createMappingFor(knownOrigin, alice.address);
      expect(await mapping.originCreatorOf(knownOrigin)).to.equal(alice.address);
    });

    it("should revert if the origin is not mapped", async () => {
      await expect(mapping.originCreatorOf(knownOrigin)).to.be.revertedWithCustomError(mapping, "OriginNotMapped");
    });
  });
});
