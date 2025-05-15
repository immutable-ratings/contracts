import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";
import { ethers } from "hardhat";

import { ImmutableRatingsV1, ImmutableRatingsV1__factory, TDN, TUP } from "../../types";

interface MarketRatingStruct {
  url: string;
  amount: bigint;
}

describe("Immutable Ratings", () => {
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;

  let tup: TUP;
  let tdn: TDN;
  let immutableRatings: ImmutableRatingsV1;

  let immutableRatingsFactory: ImmutableRatingsV1__factory;

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

    immutableRatingsFactory = await ethers.getContractFactory("ImmutableRatingsV1");
    immutableRatings = await immutableRatingsFactory.deploy(tup.target, tdn.target, receiver.address);
    await immutableRatings.waitForDeployment();

    await tup.grantRole(await tup.MINTER_ROLE(), immutableRatings.target);
    await tdn.grantRole(await tdn.MINTER_ROLE(), immutableRatings.target);
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
      expect(await immutableRatings.receiver()).to.equal(receiver.address);
      expect(await immutableRatings.tokenUp()).to.equal(tup.target);
      expect(await immutableRatings.tokenDown()).to.equal(tdn.target);
      expect(await immutableRatings.owner()).to.equal(deployer.address);

      // Check has minter roles
      expect(await tdn.hasRole(await tdn.MINTER_ROLE(), immutableRatings.target)).to.be.true;
      expect(await tup.hasRole(await tup.MINTER_ROLE(), immutableRatings.target)).to.be.true;
    });

    it("should revert if the receiver is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(tup.target, tdn.target, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the tokenUp is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(ethers.ZeroAddress, tdn.target, receiver.address),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });

    it("should revert if the tokenDown is the zero address", async () => {
      await expect(
        immutableRatingsFactory.deploy(tup.target, ethers.ZeroAddress, receiver.address),
      ).to.be.revertedWithCustomError(immutableRatingsFactory, "ZeroAddress");
    });
  });

  describe("Create Market", () => {
    it("should create a market", async () => {
      const expectedAddress = await immutableRatings.getMarketAddress("https://www.google.com");
      await immutableRatings.createMarket("https://www.google.com");
      expect(await immutableRatings.getMarketAddress("https://www.google.com")).to.equal(expectedAddress);
    });

    it("should revert if the URL is empty", async () => {
      await expect(immutableRatings.createMarket("")).to.be.revertedWithCustomError(immutableRatings, "EmptyURL");
    });

    it("should revert if the market already exists", async () => {
      await immutableRatings.createMarket("https://www.google.com");
      await expect(immutableRatings.createMarket("https://www.google.com")).to.be.revertedWithCustomError(
        immutableRatings,
        "MarketAlreadyExists",
      );
    });

    it("should revert if the contract is paused", async () => {
      await immutableRatings.setIsPaused(true);
      await expect(immutableRatings.createMarket("https://www.google.com")).to.be.revertedWithCustomError(
        immutableRatings,
        "ContractPaused",
      );
    });
  });

  // describe("Create Rating", () => {
  //   let marketOne: string;
  //   let marketTwo: string;
  //   let marketThree: string;
  //   let marketFour: string;

  //   const upRatings: MarketRatingStruct[] = [
  //     {
  //       url: "https://www.example-one.com",
  //       amount: parseEther("1000"),
  //     },
  //     {
  //       url: "https://www.example-two.com",
  //       amount: parseEther("2000"),
  //     },
  //   ];

  //   const downRatings: MarketRatingStruct[] = [
  //     {
  //       url: "https://www.example-three.com",
  //       amount: parseEther("1000"),
  //     },
  //     {
  //       url: "https://www.example-four.com",
  //       amount: parseEther("2000"),
  //     },
  //   ];

  //   let value: bigint;

  //   beforeEach(async () => {
  //     marketOne = await immutableRatings.getMarketAddress("https://www.example-one.com");
  //     marketTwo = await immutableRatings.getMarketAddress("https://www.example-two.com");
  //     marketThree = await immutableRatings.getMarketAddress("https://www.example-three.com");
  //     marketFour = await immutableRatings.getMarketAddress("https://www.example-four.com");

  //     const total = [...upRatings, ...downRatings].reduce((acc, curr) => {
  //       return acc + curr.amount;
  //     }, 0n);

  //     value = await immutableRatings.previewPayment(total);
  //   });

  //   it("should create ratings", async () => {
  //     await immutableRatings.createRatings(upRatings, downRatings, { value });
  //   });

  //   it("should mint tokens to market addresses", async () => {
  //     expect(await tup.balanceOf(marketOne)).to.equal(0);
  //     expect(await tup.balanceOf(marketTwo)).to.equal(0);
  //     expect(await tdn.balanceOf(marketThree)).to.equal(0);
  //     expect(await tdn.balanceOf(marketFour)).to.equal(0);

  //     await immutableRatings.createRatings(upRatings, downRatings, { value });

  //     expect(await tup.balanceOf(marketOne)).to.equal(upRatings[0]?.amount);
  //     expect(await tup.balanceOf(marketTwo)).to.equal(upRatings[1]?.amount);
  //     expect(await tdn.balanceOf(marketThree)).to.equal(downRatings[0]?.amount);
  //     expect(await tdn.balanceOf(marketFour)).to.equal(downRatings[1]?.amount);
  //   });

  //   it("should distribute the payment to the receiver", async () => {
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, { value })).to.changeEtherBalance(
  //       receiver,
  //       value,
  //     );
  //   });

  //   it("should emit RatingUpCreated event", async () => {
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, { value }))
  //       .to.emit(immutableRatings, "RatingUpCreated")
  //       .withArgs(deployer.address, marketOne, upRatings[0]?.amount);
  //   });

  //   it("should emit RatingDownCreated event", async () => {
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, { value }))
  //       .to.emit(immutableRatings, "RatingDownCreated")
  //       .withArgs(deployer.address, marketThree, downRatings[0]?.amount);
  //   });

  //   it("should revert if not enough ether is sent", async () => {
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, {})).to.be.revertedWithCustomError(
  //       immutableRatings,
  //       "InsufficientPayment",
  //     );
  //   });

  //   it("should revert if the amount is not a multiple of 1 ether", async () => {
  //     await expect(
  //       immutableRatings.createRatings([{ url: "https://www.example-one.com", amount: parseEther("1000.1") }], []),
  //     ).to.be.revertedWithCustomError(immutableRatings, "InvalidRatingAmount");
  //   });

  //   it("should revert if the amount is less than the minimum rating amount", async () => {
  //     await expect(
  //       immutableRatings.createRatings([{ url: "https://www.example-one.com", amount: parseEther("999") }], []),
  //     ).to.be.revertedWithCustomError(immutableRatings, "InvalidRatingAmount");
  //   });

  //   it("should skip if the market already exists", async () => {
  //     // This isn't easily testable, but can be visualised in test coverage
  //     await immutableRatings.createMarket("https://www.example-one.com");
  //     await immutableRatings.createRatings([{ url: "https://www.example-one.com", amount: parseEther("1000") }], [], {
  //       value,
  //     });
  //   });

  //   it("should revert if the contract is paused", async () => {
  //     await immutableRatings.setIsPaused(true);
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, { value })).to.be.revertedWithCustomError(
  //       immutableRatings,
  //       "ContractPaused",
  //     );
  //   });

  //   it("should refund excess payment", async () => {
  //     await expect(immutableRatings.createRatings(upRatings, downRatings, { value: value + 1n })).to.changeEtherBalance(
  //       deployer,
  //       -value,
  //     );
  //   });

  //   it("should revert if the number of ratings exceeds the maximum", async () => {
  //     const upRatings = Array(101).fill({ url: "https://www.example-one.com", amount: parseEther("1000") });

  //     await expect(immutableRatings.createRatings(upRatings, [], { value })).to.be.revertedWithCustomError(
  //       immutableRatings,
  //       "MaxRatingsExceeded",
  //     );
  //   });
  // });

  describe("TUP & TDN", () => {
    beforeEach(async () => {
      await tup.grantRole(await tup.MINTER_ROLE(), deployer.address);
      await tdn.grantRole(await tdn.MINTER_ROLE(), deployer.address);
    });

    it("should mint tokens to an address", async () => {
      await tup.mint(deployer.address, deployer.address, parseEther("1000"));
      await tdn.mint(deployer.address, deployer.address, parseEther("1000"));

      expect(await tup.balanceOf(deployer.address)).to.equal(parseEther("1000"));
      expect(await tdn.balanceOf(deployer.address)).to.equal(parseEther("1000"));
    });

    it("should update the user rating count", async () => {
      expect(await tup.upvotes(deployer.address)).to.equal(0);
      expect(await tdn.downvotes(deployer.address)).to.equal(0);

      await tup.mint(deployer.address, deployer.address, parseEther("1000"));
      await tdn.mint(deployer.address, deployer.address, parseEther("1000"));

      expect(await tup.upvotes(deployer.address)).to.equal(parseEther("1000"));
      expect(await tdn.downvotes(deployer.address)).to.equal(parseEther("1000"));
    });

    it("should revert if the caller does not have the minter role", async () => {
      await expect(
        tup.connect(receiver).mint(deployer.address, deployer.address, parseEther("1000")),
      ).to.be.revertedWithCustomError(tup, "AccessControlUnauthorizedAccount");
      await expect(
        tdn.connect(receiver).mint(deployer.address, deployer.address, parseEther("1000")),
      ).to.be.revertedWithCustomError(tdn, "AccessControlUnauthorizedAccount");
    });

    describe("Recover ERC20", () => {
      it("should recover ERC20 tokens", async () => {
        await tup.mint(deployer.address, tup.target, parseEther("1000"));
        await tdn.mint(deployer.address, tdn.target, parseEther("1000"));

        expect(await tup.balanceOf(tup.target)).to.equal(parseEther("1000"));
        expect(await tdn.balanceOf(tdn.target)).to.equal(parseEther("1000"));

        await tup.recoverERC20(tup.target, deployer.address);
        await tdn.recoverERC20(tdn.target, deployer.address);

        expect(await tup.balanceOf(tup.target)).to.equal(0);
        expect(await tdn.balanceOf(tdn.target)).to.equal(0);

        expect(await tup.balanceOf(deployer.address)).to.equal(parseEther("1000"));
        expect(await tdn.balanceOf(deployer.address)).to.equal(parseEther("1000"));
      });

      it("should revert if the token address is the zero address", async () => {
        await expect(tup.recoverERC20(ethers.ZeroAddress, deployer.address)).to.be.revertedWithCustomError(
          tup,
          "ZeroAddress",
        );
        await expect(tdn.recoverERC20(ethers.ZeroAddress, deployer.address)).to.be.revertedWithCustomError(
          tdn,
          "ZeroAddress",
        );
      });

      it("should revert if the recipient is the zero address", async () => {
        await expect(tup.recoverERC20(tup.target, ethers.ZeroAddress)).to.be.revertedWithCustomError(
          tup,
          "ZeroAddress",
        );
        await expect(tdn.recoverERC20(tdn.target, ethers.ZeroAddress)).to.be.revertedWithCustomError(
          tdn,
          "ZeroAddress",
        );
      });

      it("should revert if not the owner", async () => {
        await expect(tup.connect(receiver).recoverERC20(tup.target, deployer.address)).to.be.revertedWithCustomError(
          tup,
          "AccessControlUnauthorizedAccount",
        );
        await expect(tdn.connect(receiver).recoverERC20(tdn.target, deployer.address)).to.be.revertedWithCustomError(
          tdn,
          "AccessControlUnauthorizedAccount",
        );
      });
    });
  });

  describe("Preview Payment", () => {
    it("should preview the payment", async () => {
      expect(await immutableRatings.previewPayment(parseEther("1000"))).to.equal(parseEther("0.00007"));
      expect(await immutableRatings.previewPayment(parseEther("100000"))).to.equal(parseEther("0.007"));
      expect(await immutableRatings.previewPayment(parseEther("1000000"))).to.equal(parseEther("0.07"));
      expect(await immutableRatings.previewPayment(parseEther("10000000"))).to.equal(parseEther("0.7"));
    });
  });

  describe("Create Single Rating", () => {
    const url = "https://www.example.com";
    const amount = parseEther("1000");
    const payment = parseEther("0.00007");
    let marketAddress: string;

    beforeEach(async () => {
      marketAddress = await immutableRatings.getMarketAddress(url);
    });

    describe("Create Up Rating", () => {
      it("should create an up rating", async () => {
        await immutableRatings.createUpRating({ url, amount }, { value: payment });
        expect(await tup.balanceOf(marketAddress)).to.equal(amount);
      });

      it("should update user rating count", async () => {
        await immutableRatings.createUpRating({ url, amount }, { value: payment });
        const ratingCount = await immutableRatings.getUserRatings(deployer.address);
        expect(ratingCount).to.equal(amount);
      });

      it("should emit RatingUpCreated event", async () => {
        await expect(immutableRatings.createUpRating({ url, amount }, { value: payment }))
          .to.emit(immutableRatings, "RatingUpCreated")
          .withArgs(deployer.address, marketAddress, amount);
      });

      it("should distribute payment to receiver", async () => {
        await expect(immutableRatings.createUpRating({ url, amount }, { value: payment })).to.changeEtherBalance(
          receiver,
          payment,
        );
      });

      it("should revert if insufficient payment", async () => {
        await expect(immutableRatings.createUpRating({ url, amount }, { value: 0 })).to.be.revertedWithCustomError(
          immutableRatings,
          "InsufficientPayment",
        );
      });

      it("should revert if invalid amount", async () => {
        await expect(
          immutableRatings.createUpRating({ url, amount: parseEther("999") }, { value: payment }),
        ).to.be.revertedWithCustomError(immutableRatings, "InvalidRatingAmount");
      });

      it("should revert if the contract is paused", async () => {
        await immutableRatings.setIsPaused(true);
        await expect(
          immutableRatings.createUpRating({ url, amount }, { value: payment }),
        ).to.be.revertedWithCustomError(immutableRatings, "ContractPaused");
      });

      it("should refund excess payment", async () => {
        // Checks that only the correct amount (0.00007) has been sent to the contract
        await expect(
          immutableRatings.createUpRating({ url, amount: parseEther("1000") }, { value: parseEther("0.00008") }),
        ).to.changeEtherBalance(deployer, -parseEther("0.00007"));
      });
    });

    describe("Create Down Rating", () => {
      it("should create a down rating", async () => {
        await immutableRatings.createDownRating({ url, amount }, { value: payment });
        expect(await tdn.balanceOf(marketAddress)).to.equal(amount);
      });

      it("should update user rating count", async () => {
        await immutableRatings.createDownRating({ url, amount }, { value: payment });
        const ratingCount = await immutableRatings.getUserRatings(deployer.address);
        expect(ratingCount).to.equal(amount);
      });

      it("should emit RatingDownCreated event", async () => {
        await expect(immutableRatings.createDownRating({ url, amount }, { value: payment }))
          .to.emit(immutableRatings, "RatingDownCreated")
          .withArgs(deployer.address, marketAddress, amount);
      });

      it("should distribute payment to receiver", async () => {
        await expect(immutableRatings.createDownRating({ url, amount }, { value: payment })).to.changeEtherBalance(
          receiver,
          payment,
        );
      });

      it("should revert if insufficient payment", async () => {
        await expect(immutableRatings.createDownRating({ url, amount }, { value: 0 })).to.be.revertedWithCustomError(
          immutableRatings,
          "InsufficientPayment",
        );
      });

      it("should revert if invalid amount", async () => {
        await expect(
          immutableRatings.createDownRating({ url, amount: parseEther("999") }, { value: payment }),
        ).to.be.revertedWithCustomError(immutableRatings, "InvalidRatingAmount");
      });

      it("should revert if the contract is paused", async () => {
        await immutableRatings.setIsPaused(true);
        await expect(
          immutableRatings.createDownRating({ url, amount }, { value: payment }),
        ).to.be.revertedWithCustomError(immutableRatings, "ContractPaused");
      });

      it("should refund excess payment", async () => {
        await expect(
          immutableRatings.createDownRating({ url, amount: parseEther("1000") }, { value: parseEther("0.00008") }),
        ).to.changeEtherBalance(deployer, -parseEther("0.00007"));
      });
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
      await immutableRatings.createUpRating(
        { url: "https://www.example.com", amount: parseEther("1000") },
        { value: parseEther("0.00007") },
      );
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
});
