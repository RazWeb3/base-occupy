// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -------------------------------------------------------
// 目的: Base OccupyゲームのコアロジックおよびNFT管理を担当するコントラクトです
// 作成日: 2025/12/18
//
// 更新履歴:
// 2025/12/18 17:05 初期実装 (仕様書v1準拠)
// -------------------------------------------------------

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract BaseOccupy is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // --- State Variables ---

    uint256 public prizePool;
    uint256 public adminFeeBalance;
    address public lastDepositor;
    uint256 public deadline;
    bool public isSuddenDeath;
    uint256 public gameRound;
    uint256 public nextTokenId;

    // --- Constants ---

    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant FEE_PERCENT = 10;
    uint256 public constant DEADLINE_EXTENSION = 10 minutes;
    uint256 public constant SUDDEN_DEATH_EXTENSION = 1 minutes;

    // --- Structs ---

    struct UserStat {
        uint256 tokenId;
        uint256 depositCount;
        uint256 winCount;
        uint256 lastWinRound;
        bool isEternalKing;
        bool hasMinted;
    }

    // --- Mappings ---

    mapping(address => UserStat) public userStats;
    mapping(address => uint256) public pendingWithdrawals;

    // --- Events ---

    event Occupied(address indexed user, uint256 newPrizePool, uint256 newDeadline, uint256 round);
    event WinnerClaimed(address indexed winner, uint256 reward, uint256 round);
    event WinnerArchived(address indexed winner, uint256 reward, uint256 round);
    event SuddenDeathTriggered(uint256 timestamp);
    event AdminFeesWithdrawn(uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    // --- Constructor ---

    constructor() ERC721("Base Occupy Membership", "BOM") Ownable(msg.sender) {
        gameRound = 1;
        nextTokenId = 1;
        // 初回はdeadlineを0にしておき、最初のoccupyで設定、あるいはデプロイ時は開始しない等の設計が可能だが、
        // ここでは最初のOccupyまでdeadlineチェックをスキップするか、初期値を設定するか。
        // 仕様では「Occupyするたびに延長」なので、最初のOccupyはいつでも可能であるべき。
        // 実装として、deadline == 0 の場合はゲーム未開始とみなし、無条件でOccupy可能にする。
    }

    // --- Core Game Functions ---

    function occupy() external payable nonReentrant {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        
        // Handle Game Reset if previous game ended
        if (deadline > 0 && block.timestamp > deadline) {
            _archiveWinner();
        }

        // 手数料計算
        uint256 fee = (msg.value * FEE_PERCENT) / 100;
        uint256 prize = msg.value - fee;

        prizePool += prize;
        adminFeeBalance += fee;

        // Deadline更新
        uint256 extension = isSuddenDeath ? SUDDEN_DEATH_EXTENSION : DEADLINE_EXTENSION;
        deadline = block.timestamp + extension;

        lastDepositor = msg.sender;

        // ユーザーデータ更新
        UserStat storage stat = userStats[msg.sender];
        stat.depositCount++;

        // NFT Mint (初回のみ)
        if (!stat.hasMinted) {
            uint256 newItemId = nextTokenId;
            _safeMint(msg.sender, newItemId);
            stat.tokenId = newItemId;
            stat.hasMinted = true;
            nextTokenId++;
        }

        emit Occupied(msg.sender, prizePool, deadline, gameRound);
    }

    function _archiveWinner() internal {
        if (lastDepositor == address(0)) return;

        uint256 reward = prizePool;
        address winner = lastDepositor;

        // Reset Game State
        prizePool = 0;
        lastDepositor = address(0);
        isSuddenDeath = false;
        
        // Update Winner Stats
        UserStat storage stat = userStats[winner];
        stat.winCount++;
        stat.isEternalKing = true;
        stat.lastWinRound = gameRound;

        // Archive Funds
        if (reward > 0) {
            pendingWithdrawals[winner] += reward;
        }

        emit WinnerArchived(winner, reward, gameRound);
        gameRound++;
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    function settleRound() external nonReentrant {
        require(deadline > 0 && block.timestamp > deadline, "Game not ended");
        require(lastDepositor != address(0), "Already settled");
        
        _archiveWinner();

        // Auto-withdraw if caller is the winner (now has pending funds)
        if (pendingWithdrawals[msg.sender] > 0) {
            uint256 amount = pendingWithdrawals[msg.sender];
            pendingWithdrawals[msg.sender] = 0;
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
            emit Withdrawal(msg.sender, amount);
        }
    }

    // Deprecated but kept for backward compatibility if needed, 
    // effectively just a wrapper for withdraw if the caller has pending funds.
    // Or we can repurpose it to trigger the archive if called by winner?
    // Let's remove it to avoid confusion as requested by the new design pattern.
    // But since I cannot delete lines easily without context, I will replace it.
    
    // --- Admin Functions ---

    function triggerSuddenDeath() external onlyOwner {
        isSuddenDeath = true;
        emit SuddenDeathTriggered(block.timestamp);
    }

    function withdrawAdminFees() external onlyOwner {
        uint256 amount = adminFeeBalance;
        require(amount > 0, "No fees to withdraw");
        
        adminFeeBalance = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit AdminFeesWithdrawn(amount);
    }

    // --- NFT Metadata Logic ---

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // ERC721 helper to check existence

        address owner = ownerOf(tokenId);
        UserStat memory stat = userStats[owner];
        
        string memory rank;
        string memory imageSVG;

        if (stat.isEternalKing) {
            rank = "Eternal King";
            imageSVG = _generateSVG("Eternal King", "#FFD700", "Crown");
        } else if (owner == lastDepositor && deadline > 0 && block.timestamp <= deadline) {
            rank = "Current King";
            imageSVG = _generateSVG("Current King", "#00BFFF", "Sword");
        } else if (stat.depositCount > 10) {
            rank = "Veteran";
            imageSVG = _generateSVG("Veteran", "#C0C0C0", "Helm");
        } else {
            rank = "Challenger";
            imageSVG = _generateSVG("Challenger", "#CD853F", "Hat");
        }

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Base Occupy #', tokenId.toString(), 
                        '", "description": "Membership NFT for Base Occupy game.", ',
                        '"attributes": [{"trait_type": "Rank", "value": "', rank, '"}, ',
                        '{"trait_type": "Deposits", "value": ', stat.depositCount.toString(), '}, ',
                        '{"trait_type": "Wins", "value": ', stat.winCount.toString(), '}], ',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(imageSVG)), '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _generateSVG(string memory rank, string memory color, string memory icon) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            '<style>.base { fill: white; font-family: serif; font-size: 24px; }</style>',
            '<rect width="100%" height="100%" fill="', color, '" />',
            '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">',
            rank, ' (', icon, ')</text>',
            '</svg>'
        ));
    }
}
