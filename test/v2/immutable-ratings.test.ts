import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  impersonateAccount,
  loadFixture,
  setBalance,
  stopImpersonatingAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SWAP_ROUTER_02_ADDRESSES, WETH9 } from "@uniswap/sdk-core";
import { expect } from "chai";
import { AbiCoder, MaxInt256, ZeroAddress, parseEther, solidityPacked } from "ethers";
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
const weth = WETH9[8453].address;
const data = "0x";

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
      await immutableRatings.createUpRating(url, amount, data);
      expect(await tup.balanceOf(_address)).to.equal(amount);
    });

    it("should update user rating count", async () => {
      await immutableRatings.createUpRating(url, amount, data);
      const ratingCount = await immutableRatings.getUserRatings(deployer.address);
      expect(ratingCount).to.equal(amount);
    });

    it("should emit RatingUpCreated event", async () => {
      await expect(immutableRatings.createUpRating(url, amount, data))
        .to.emit(immutableRatings, "RatingUpCreated")
        .withArgs(deployer.address, url, amount, data);
    });

    it("should distribute payment to receiver", async () => {
      await expect(immutableRatings.createUpRating(url, amount, data)).to.changeTokenBalances(
        usdc,
        [deployer.address, receiver.address],
        [-payment, payment],
      );
    });

    it("should revert if insufficient payment", async () => {
      await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
      await expect(immutableRatings.createUpRating(url, amount, data)).to.be.revertedWith("STF");
    });

    it("should revert if invalid amount", async () => {
      await expect(immutableRatings.createUpRating(url, parseEther("0.1"), data)).to.be.revertedWithCustomError(
        immutableRatings,
        "InvalidRatingAmount",
      );
    });

    it("should revert if the contract is paused", async () => {
      await immutableRatings.setIsPaused(true);
      await expect(immutableRatings.createUpRating(url, amount, data)).to.be.revertedWithCustomError(
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
      await immutableRatings.createDownRating(url, amount, data);
      expect(await tdn.balanceOf(_address)).to.equal(amount);
    });

    it("should update user rating count", async () => {
      await immutableRatings.createDownRating(url, amount, data);
      const ratingCount = await immutableRatings.getUserRatings(deployer.address);
      expect(ratingCount).to.equal(amount);
    });

    it("should emit RatingDownCreated event", async () => {
      await expect(immutableRatings.createDownRating(url, amount, data))
        .to.emit(immutableRatings, "RatingDownCreated")
        .withArgs(deployer.address, url, amount, data);
    });

    it("should distribute payment to receiver", async () => {
      await expect(immutableRatings.createDownRating(url, amount, data)).to.changeTokenBalances(
        usdc,
        [deployer.address, receiver.address],
        [-payment, payment],
      );
    });

    it("should revert if insufficient payment", async () => {
      await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
      await expect(immutableRatings.createDownRating(url, amount, data)).to.be.revertedWith("STF");
    });

    it("should revert if invalid amount", async () => {
      await expect(immutableRatings.createDownRating(url, parseEther("0.1"), data)).to.be.revertedWithCustomError(
        immutableRatings,
        "InvalidRatingAmount",
      );
    });

    it("should revert if the contract is paused", async () => {
      await immutableRatings.setIsPaused(true);
      await expect(immutableRatings.createDownRating(url, amount, data)).to.be.revertedWithCustomError(
        immutableRatings,
        "ContractPaused",
      );
    });
  });

  describe("swaps", () => {
    const url = "https://www.example.com";
    const amount = parseEther("1000");
    let _address: string;

    beforeEach(async () => {
      _address = await mapping.previewAddress(url);
    });

    describe("createUpRatingSwap", () => {
      const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
        token: tokens.degen.address,
        path: solidityPacked(["address", "uint24", "address"], [tokens.usdc.address, 10000, tokens.degen.address]),
        amountInMaximum: parseDegen("100"),
      };

      it("should create an up rating", async () => {
        expect(await tup.balanceOf(_address)).to.equal(0);
        await degen.approve(immutableRatings.target, MaxInt256);
        await expect(immutableRatings.createUpRatingSwap(url, amount, swapParams, data)).changeTokenBalances(
          usdc,
          [receiver.address],
          [parseUsdc("0.1")],
        );
      });

      it("should revert if insufficient payment", async () => {
        await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
        await expect(immutableRatings.createUpRatingSwap(url, amount, swapParams, data)).to.be.revertedWith("STF");
      });

      it("should swap a native token", async () => {
        const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
          token: ZeroAddress,
          path: solidityPacked(["address", "uint24", "address"], [tokens.usdc.address, 500, weth]),
          amountInMaximum: parseEther("1.0"),
        };

        const balanceBefore = await ethers.provider.getBalance(deployer.address);
        await expect(
          immutableRatings.createUpRatingSwap(url, amount, swapParams, data, { value: parseEther("1.0") }),
        ).changeTokenBalances(usdc, [receiver.address], [parseUsdc("0.1")]);
        const balanceAfter = await ethers.provider.getBalance(deployer.address);
      });
    });

    describe("createDownRatingSwap", () => {
      const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
        token: tokens.degen.address,
        path: solidityPacked(["address", "uint24", "address"], [tokens.usdc.address, 10000, tokens.degen.address]),
        amountInMaximum: parseDegen("100"),
      };

      it("should create a down rating", async () => {
        expect(await tdn.balanceOf(_address)).to.equal(0);
        await degen.approve(immutableRatings.target, MaxInt256);
        await expect(immutableRatings.createDownRatingSwap(url, amount, swapParams, data)).changeTokenBalances(
          usdc,
          [receiver.address],
          [parseUsdc("0.1")],
        );
      });

      it("should revert if insufficient payment", async () => {
        await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
        await expect(immutableRatings.createDownRatingSwap(url, amount, swapParams, data)).to.be.revertedWith("STF");
      });
    });

    describe("Set Receiver", () => {
      it("should set the receiver", async () => {
        await immutableRatings.setReceiver(receiver.address);
        expect(await immutableRatings.receiver()).to.equal(receiver.address);
      });

      it("should revert if not the owner", async () => {
        await expect(immutableRatings.connect(receiver).setReceiver(receiver.address)).to.be.revertedWithCustomError(
          immutableRatings,
          "OwnableUnauthorizedAccount",
        );
      });

      it("should emit ReceiverUpdated event", async () => {
        await expect(immutableRatings.setReceiver(receiver.address))
          .to.emit(immutableRatings, "ReceiverUpdated")
          .withArgs(receiver.address);
      });
    });

    describe("Get User Ratings", () => {
      it("should get the user ratings", async () => {
        expect(await immutableRatings.getUserRatings(deployer.address)).to.equal(0);
        await usdc.approve(immutableRatings.target, MaxInt256);
        await immutableRatings.createUpRating("https://www.example.com", parseEther("1000"), data);
        expect(await immutableRatings.getUserRatings(deployer.address)).to.equal(parseEther("1000"));
      });
    });

    describe("Set Paused", () => {
      it("should set the paused state to true", async () => {
        await immutableRatings.setIsPaused(true);
        expect(await immutableRatings.isPaused()).to.equal(true);
      });

      it("should set the paused state to false", async () => {
        await immutableRatings.setIsPaused(false);
        expect(await immutableRatings.isPaused()).to.equal(false);
      });

      it("should revert if not the owner", async () => {
        await expect(immutableRatings.connect(receiver).setIsPaused(true)).to.be.revertedWithCustomError(
          immutableRatings,
          "OwnableUnauthorizedAccount",
        );
      });

      it("should emit Paused event", async () => {
        await expect(immutableRatings.setIsPaused(true)).to.emit(immutableRatings, "Paused").withArgs(true);
        await expect(immutableRatings.setIsPaused(false)).to.emit(immutableRatings, "Paused").withArgs(false);
      });
    });

    describe("Transfer Ownership", () => {
      it("should transfer ownership", async () => {
        expect(await immutableRatings.owner()).to.equal(deployer.address);
        await immutableRatings.transferOwnership(receiver.address);
        expect(await immutableRatings.pendingOwner()).to.equal(receiver.address);
        await immutableRatings.connect(receiver).acceptOwnership();
        expect(await immutableRatings.owner()).to.equal(receiver.address);
      });
    });

    describe("Recover ERC20", () => {
      it("should recover ERC20 tokens", async () => {
        await tup.grantRole(await tup.MINTER_ROLE(), deployer.address);

        await tup.mint(deployer.address, immutableRatings.target, parseEther("1000"));

        expect(await tup.balanceOf(immutableRatings.target)).to.equal(parseEther("1000"));

        await immutableRatings.recoverERC20(tup.target, deployer.address);

        expect(await tup.balanceOf(deployer.address)).to.equal(parseEther("1000"));
        expect(await tup.balanceOf(immutableRatings.target)).to.equal(0);
      });

      it("should revert if the token address is the zero address", async () => {
        await expect(immutableRatings.recoverERC20(ethers.ZeroAddress, deployer.address)).to.be.revertedWithCustomError(
          immutableRatings,
          "ZeroAddress",
        );
      });

      it("should revert if the recipient is the zero address", async () => {
        await expect(immutableRatings.recoverERC20(tup.target, ethers.ZeroAddress)).to.be.revertedWithCustomError(
          immutableRatings,
          "ZeroAddress",
        );
      });

      it("should revert if not the owner", async () => {
        await expect(
          immutableRatings.connect(receiver).recoverERC20(tup.target, deployer.address),
        ).to.be.revertedWithCustomError(immutableRatings, "OwnableUnauthorizedAccount");
      });
    });

    describe("Set Payment Token", () => {
      it("should set the payment token", async () => {
        expect(await immutableRatings.paymentToken()).to.equal(usdc.target);
        await immutableRatings.setPaymentToken(degen.target);
        expect(await immutableRatings.paymentToken()).to.equal(degen.target);
      });

      it("should revert if not the owner", async () => {
        await expect(immutableRatings.connect(receiver).setPaymentToken(usdc.target)).to.be.revertedWithCustomError(
          immutableRatings,
          "OwnableUnauthorizedAccount",
        );
      });

      it("should emit PaymentTokenUpdated event", async () => {
        await expect(immutableRatings.setPaymentToken(degen.target))
          .to.emit(immutableRatings, "PaymentTokenUpdated")
          .withArgs(degen.target);
      });
    });

    describe("Set Rating Price", () => {
      it("should set the rating price", async () => {
        expect(await immutableRatings.ratingPrice()).to.equal(price);
        await immutableRatings.setRatingPrice(parseUsdc("0.00007"));
        expect(await immutableRatings.ratingPrice()).to.equal(parseUsdc("0.00007"));
      });

      it("should revert if not the owner", async () => {
        await expect(
          immutableRatings.connect(receiver).setRatingPrice(parseUsdc("0.00007")),
        ).to.be.revertedWithCustomError(immutableRatings, "OwnableUnauthorizedAccount");
      });

      it("should emit RatingPriceUpdated event", async () => {
        await expect(immutableRatings.setRatingPrice(parseUsdc("0.2")))
          .to.emit(immutableRatings, "RatingPriceUpdated")
          .withArgs(parseUsdc("0.2"));
      });
    });
  });

  describe("Native Payment Token", () => {
    const nativePrice = parseEther("0.00001");
    let nativeImmutableRatings: ImmutableRatings;

    const url = "https://www.example.com";
    let _address: string;
    const amount = parseEther("1000");
    const value = parseEther("0.01");

    beforeEach(async () => {
      nativeImmutableRatings = await immutableRatingsFactory.deploy(
        tup.target,
        tdn.target,
        mapping.target,
        receiver.address,
        swapRouter,
        ethers.ZeroAddress,
        nativePrice,
      );
      await nativeImmutableRatings.waitForDeployment();

      await tup.grantRole(await tup.MINTER_ROLE(), nativeImmutableRatings.target);
      await tdn.grantRole(await tdn.MINTER_ROLE(), nativeImmutableRatings.target);

      _address = await mapping.previewAddress(url);
    });

    describe("createUpRating", () => {
      it("should create an up rating", async () => {
        await nativeImmutableRatings.createUpRating(url, amount, data, { value });
        expect(await tup.balanceOf(_address)).to.equal(amount);
      });

      it("should revert if the value is less than the payment", async () => {
        await expect(
          nativeImmutableRatings.createUpRating(url, amount, data, { value: parseEther("0.00009") }),
        ).to.be.revertedWithCustomError(nativeImmutableRatings, "InvalidPayment");
      });

      it("should revert if the value is greater than the payment", async () => {
        await expect(
          nativeImmutableRatings.createUpRating(url, amount, data, { value: parseEther("0.11") }),
        ).to.be.revertedWithCustomError(nativeImmutableRatings, "InvalidPayment");
      });
    });

    describe("createDownRating", () => {
      it("should create a down rating", async () => {
        await nativeImmutableRatings.createDownRating(url, amount, data, { value });
        expect(await tdn.balanceOf(_address)).to.equal(amount);
      });

      it("should revert if the value is less than the payment", async () => {
        await expect(
          nativeImmutableRatings.createDownRating(url, amount, data, { value: parseEther("0.00009") }),
        ).to.be.revertedWithCustomError(nativeImmutableRatings, "InvalidPayment");
      });

      it("should revert if the value is greater than the payment", async () => {
        await expect(
          nativeImmutableRatings.createDownRating(url, amount, data, { value: parseEther("0.11") }),
        ).to.be.revertedWithCustomError(nativeImmutableRatings, "InvalidPayment");
      });
    });

    describe("createUpRatingSwap", () => {
      const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
        token: tokens.usdc.address,
        path: solidityPacked(["address", "uint24", "address"], [weth, 500, tokens.usdc.address]),
        amountInMaximum: parseUsdc("1000"),
      };

      it("should create an up rating", async () => {
        expect(await tup.balanceOf(_address)).to.equal(0);
        await usdc.approve(nativeImmutableRatings.target, MaxInt256);
        await expect(nativeImmutableRatings.createUpRatingSwap(url, amount, swapParams, data)).changeEtherBalance(
          receiver.address,
          value,
        );
      });

      it("should revert if insufficient payment", async () => {
        await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
        await expect(nativeImmutableRatings.createUpRatingSwap(url, amount, swapParams, data)).to.be.revertedWith(
          "STF",
        );
      });
    });

    describe("createDownRatingSwap", () => {
      const swapParams: ImmutableRatings.SwapParamsMultihopStruct = {
        token: tokens.usdc.address,
        path: solidityPacked(["address", "uint24", "address"], [weth, 500, tokens.usdc.address]),
        amountInMaximum: parseUsdc("1000"),
      };

      it("should create a down rating", async () => {
        expect(await tdn.balanceOf(_address)).to.equal(0);
        await usdc.approve(nativeImmutableRatings.target, MaxInt256);
        await expect(nativeImmutableRatings.createDownRatingSwap(url, amount, swapParams, data)).changeEtherBalance(
          receiver.address,
          value,
        );
      });

      it("should revert if insufficient payment", async () => {
        await usdc.transfer(receiver.address, await usdc.balanceOf(deployer.address));
        await expect(nativeImmutableRatings.createDownRatingSwap(url, amount, swapParams, data)).to.be.revertedWith(
          "STF",
        );
      });
    });
  });
});
