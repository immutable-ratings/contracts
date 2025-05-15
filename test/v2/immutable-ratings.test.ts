import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  impersonateAccount,
  loadFixture,
  setBalance,
  stopImpersonatingAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SWAP_ROUTER_02_ADDRESSES, V2_ROUTER_ADDRESSES } from "@uniswap/sdk-core";
import { expect } from "chai";
import { AbiCoder, MaxInt256, parseEther, solidityPacked } from "ethers";
import { providers } from "ethers5";
import { ethers } from "hardhat";

import {
  ERC20,
  ERC20__factory,
  ImmutableMapping,
  ImmutableMapping__factory,
  ImmutableRatings,
  ImmutableRatings__factory,
  TDN,
  TUP,
} from "../../types";
import { Token, parseDegen, parseUsdc, tokens } from "./tokens.test";

const price = parseUsdc("0.0001"); // $0.0001 USDC
const swapRouter = SWAP_ROUTER_02_ADDRESSES(8453);

describe("Immutable Ratings", () => {
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;

  let tup: TUP;
  let tdn: TDN;
  let immutableRatings: ImmutableRatings;
  let mapping: ImmutableMapping;

  let usdc: ERC20;
  let degen: ERC20;

  let immutableRatingsFactory: ImmutableRatings__factory;
  let mappingFactory: ImmutableMapping__factory;

  before(async () => {
    const signers = await ethers.getSigners();

    [deployer, receiver] = signers as [SignerWithAddress, SignerWithAddress];
  });

  const deploy = async () => {
    const tupFactory = await ethers.getContractFactory("TUP");
    tup = await tupFactory.deploy();
    await tup.waitForDeployment();

    const tdnFactory = await ethers.getContractFactory("TDN");
    tdn = await tdnFactory.deploy();
    await tdn.waitForDeployment();

    const mappingFactory = await ethers.getContractFactory("ImmutableMapping");
    mapping = await mappingFactory.deploy();
    await mapping.waitForDeployment();

    usdc = ERC20__factory.connect(tokens.usdc.address, deployer);
    degen = ERC20__factory.connect(tokens.degen.address, deployer);

    immutableRatingsFactory = await ethers.getContractFactory("ImmutableRatings");
    immutableRatings = await immutableRatingsFactory.deploy(
      tup.target,
      tdn.target,
      mapping.target,
      receiver.address,
      swapRouter,
      usdc.target,
      price,
    );
    await immutableRatings.waitForDeployment();

    await tup.grantRole(await tup.MINTER_ROLE(), immutableRatings.target);
    await tdn.grantRole(await tdn.MINTER_ROLE(), immutableRatings.target);

    await sendFundsTo("usdc", deployer.address);
    await sendFundsTo("degen", deployer.address);
  };

  const sendFundsTo = async (token: Token, receiver: string) => {
    const { address, whale, parse } = tokens[token];
    await impersonateAccount(whale);
    await setBalance(whale, parseEther("1000"));
    const signer = await ethers.getSigner(whale);
    const contract = ERC20__factory.connect(address, signer);
    await contract.transfer(receiver, parse("1000"));
    await stopImpersonatingAccount(whale);
  };

  beforeEach(async () => {
    await loadFixture(deploy);
  });

  describe("Deployment", () => {
    it("should deploy TUP", async () => {
      expect(await tup.totalSupply()).to.equal(0);
      expect(await tup.name()).to.equal("Thumbs Up");
      expect(await tup.symbol()).to.equal("TUP");
      expect(await tup.decimals()).to.equal(18);
    });

    it("should deploy TDN", async () => {
      expect(await tdn.totalSupply()).to.equal(0);
      expect(await tdn.name()).to.equal("Thumbs Down");
      expect(await tdn.symbol()).to.equal("TDN");
      expect(await tdn.decimals()).to.equal(18);
    });

    it("should deploy ImmutableRatings", async () => {
      expect(await immutableRatings.VERSION()).to.equal("2.0.0");

      expect(await immutableRatings.tokenUp()).to.equal(tup.target);
      expect(await immutableRatings.tokenDown()).to.equal(tdn.target);
      expect(await immutableRatings.immutableMapping()).to.equal(mapping.target);
      expect(await immutableRatings.receiver()).to.equal(receiver.address);
      expect(await immutableRatings.paymentToken()).to.equal(usdc.target);
      expect(await immutableRatings.ratingPrice()).to.equal(price);
      expect(await immutableRatings.owner()).to.equal(deployer.address);

      // Check has minter roles
      expect(await tdn.hasRole(await tdn.MINTER_ROLE(), immutableRatings.target)).to.be.true;
      expect(await tup.hasRole(await tup.MINTER_ROLE(), immutableRatings.target)).to.be.true;
    });

    it("should revert if the tup is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(
          ethers.ZeroAddress,
          tdn.target,
          mapping.target,
          receiver.address,
          swapRouter,
          usdc.target,
          price,
        ),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the tdn is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(
          tup.target,
          ethers.ZeroAddress,
          mapping.target,
          receiver.address,
          swapRouter,
          usdc.target,
          price,
        ),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the mapping is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(
          tup.target,
          tdn.target,
          ethers.ZeroAddress,
          receiver.address,
          swapRouter,
          usdc.target,
          price,
        ),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the receiver is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(
          tup.target,
          tdn.target,
          mapping.target,
          ethers.ZeroAddress,
          swapRouter,
          usdc.target,
          price,
        ),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the swap router is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(
          tup.target,
          tdn.target,
          mapping.target,
          receiver.address,
          ethers.ZeroAddress,
          usdc.target,
          price,
        ),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should allow a zero payment token (native token)", async () => {
      const nativeIR = await immutableRatingsFactory.deploy(
        tup.target,
        tdn.target,
        mapping.target,
        receiver.address,
        swapRouter,
        ethers.ZeroAddress,
        price,
      );
      await nativeIR.waitForDeployment();

      expect(await nativeIR.paymentToken()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("previewPayment", () => {
    it("should return the correct price", async () => {
      // 1K ratings should cost 0.1 USDC
      expect(await immutableRatings.previewPayment(parseEther("1000"))).to.equal(parseUsdc("0.1"));
      expect(await immutableRatings.previewPayment(parseEther("100000"))).to.equal(parseUsdc("10"));
      expect(await immutableRatings.previewPayment(parseEther("1000000"))).to.equal(parseUsdc("100"));
      expect(await immutableRatings.previewPayment(parseEther("10000000"))).to.equal(parseUsdc("1000"));
    });
  });

  describe("createUpRating", () => {
    const url = "https://www.example.com";
    const amount = parseEther("1000");
    const payment = parseUsdc("0.1");
    let _address: string;

    beforeEach(async () => {
      await usdc.approve(immutableRatings.target, payment);
      _address = await mapping.previewAddress(url);
    });

    it("should create an up rating", async () => {
      expect(await tup.balanceOf(_address)).to.equal(0);
      await immutableRatings.createUpRating(url, amount);
      expect(await tup.balanceOf(_address)).to.equal(amount);
    });

    it("should update user rating count", async () => {
      await immutableRatings.createUpRating(url, amount);
      const ratingCount = await immutableRatings.getUserRatings(deployer.address);
      expect(ratingCount).to.equal(amount);
    });

    it("should emit RatingUpCreated event", async () => {
      await expect(immutableRatings.createUpRating(url, amount))
        .to.emit(immutableRatings, "RatingUpCreated")
        .withArgs(deployer.address, url, amount);
    });

    it("should distribute payment to receiver", async () => {
      await expect(immutableRatings.createUpRating(url, amount)).to.changeTokenBalances(
        usdc,
        [deployer.address, receiver.address],
        [-payment, payment],
      );
    });

    it("should revert if insufficient payment", async () => {
      await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
      await expect(immutableRatings.createUpRating(url, amount)).to.be.revertedWith("STF");
    });

    it("should revert if invalid amount", async () => {
      await expect(immutableRatings.createUpRating(url, parseEther("0.1"))).to.be.revertedWithCustomError(
        immutableRatings,
        "InvalidRatingAmount",
      );
    });

    it("should revert if the contract is paused", async () => {
      await immutableRatings.setIsPaused(true);
      await expect(immutableRatings.createUpRating(url, amount)).to.be.revertedWithCustomError(
        immutableRatings,
        "ContractPaused",
      );
    });
  });

  describe("createDownRating", () => {
    const url = "https://www.example.com";
    const amount = parseEther("1000");
    const payment = parseUsdc("0.1");
    let _address: string;

    beforeEach(async () => {
      await usdc.approve(immutableRatings.target, payment);
      _address = await mapping.previewAddress(url);
    });

    it("should create a down rating", async () => {
      expect(await tdn.balanceOf(_address)).to.equal(0);
      await immutableRatings.createDownRating(url, amount);
      expect(await tdn.balanceOf(_address)).to.equal(amount);
    });

    it("should update user rating count", async () => {
      await immutableRatings.createDownRating(url, amount);
      const ratingCount = await immutableRatings.getUserRatings(deployer.address);
      expect(ratingCount).to.equal(amount);
    });

    it("should emit RatingDownCreated event", async () => {
      await expect(immutableRatings.createDownRating(url, amount))
        .to.emit(immutableRatings, "RatingDownCreated")
        .withArgs(deployer.address, url, amount);
    });

    it("should distribute payment to receiver", async () => {
      await expect(immutableRatings.createDownRating(url, amount)).to.changeTokenBalances(
        usdc,
        [deployer.address, receiver.address],
        [-payment, payment],
      );
    });

    it("should revert if insufficient payment", async () => {
      await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
      await expect(immutableRatings.createDownRating(url, amount)).to.be.revertedWith("STF");
    });

    it("should revert if invalid amount", async () => {
      await expect(immutableRatings.createDownRating(url, parseEther("0.1"))).to.be.revertedWithCustomError(
        immutableRatings,
        "InvalidRatingAmount",
      );
    });

    it("should revert if the contract is paused", async () => {
      await immutableRatings.setIsPaused(true);
      await expect(immutableRatings.createDownRating(url, amount)).to.be.revertedWithCustomError(
        immutableRatings,
        "ContractPaused",
      );
    });
  });

  describe.only("swaps", () => {
    const url = "https://www.example.com";
    const amount = parseEther("1000");
    let _address: string;

    beforeEach(async () => {
      _address = await mapping.previewAddress(url);
    });

    describe("createUpRatingSwapSingle", () => {
      const swapParams: ImmutableRatings.SwapParamsSingleStruct = {
        token: tokens.degen.address,
        fee: 10000, // 1%
        amountInMaximum: parseDegen("100"),
      };

      it("should create an up rating", async () => {
        expect(await tup.balanceOf(_address)).to.equal(0);
        await degen.approve(immutableRatings.target, MaxInt256);
        await expect(immutableRatings.createUpRatingSwapSingle(url, amount, swapParams)).changeTokenBalances(
          usdc,
          [receiver.address],
          [parseUsdc("0.1")],
        );
        expect(await tup.balanceOf(_address)).to.equal(amount);
      });

      it("should revert if insufficient payment", async () => {
        await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
        await expect(immutableRatings.createUpRatingSwapSingle(url, amount, swapParams)).to.be.revertedWith("STF");
      });
    });

    describe("createUpRatingSwapMultihop", () => {
      const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
        token: tokens.degen.address,
        path: solidityPacked(["address", "uint24", "address"], [tokens.usdc.address, 10000, tokens.degen.address]),
        amountInMaximum: parseDegen("100"),
      };

      it("should create an up rating", async () => {
        expect(await tup.balanceOf(_address)).to.equal(0);
        await degen.approve(immutableRatings.target, MaxInt256);
        await expect(immutableRatings.createUpRatingSwapMultihop(url, amount, swapParams)).changeTokenBalances(
          usdc,
          [receiver.address],
          [parseUsdc("0.1")],
        );
      });
    });
  });
});
