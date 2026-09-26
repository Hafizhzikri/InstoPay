// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title PayrollOS
 * @notice Multi-tenant payroll contract. Each wallet address is its own company.
 *         Employees are registered per company. Payroll is disbursed in USDC.
 */
contract PayrollOS {

    // ── USDC ─────────────────────────────────────────────────────────────────
    IERC20 public immutable usdc;

    uint256 public constant MAX_BATCH_SIZE = 200;

    // ── Storage ───────────────────────────────────────────────────────────────
    struct Employee {
        address wallet;
        uint256 salaryNet;
        string  name;
        bool    active;
    }

    struct PayrollRun {
        uint256 runId;
        string  period;
        uint256 totalAmount;
        uint256 employeeCount;
        uint256 timestamp;
    }

    // company => employees (wallet => Employee)
    mapping(address => mapping(address => Employee)) private _employees;
    // company => ordered wallet list
    mapping(address => address[]) private _employeeList;
    // company => payroll runs
    mapping(address => PayrollRun[]) private _runs;
    // company => total disbursed
    mapping(address => uint256) private _totalDisbursed;

    // ── Events ────────────────────────────────────────────────────────────────
    event EmployeeRegistered(address indexed company, address indexed wallet, uint256 salaryNet, string name);
    event EmployeeUpdated(address indexed company, address indexed wallet, uint256 salaryNet, string name, bool active);
    event EmployeeRemoved(address indexed company, address indexed wallet);
    event PayrollExecuted(address indexed company, uint256 indexed runId, string period, uint256 totalAmount, uint256 employeeCount);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────
    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        require(usdc.transferFrom(from, to, amount), "USDC transfer failed");
    }

    // ── Employee management ───────────────────────────────────────────────────

    function registerEmployee(
        address wallet,
        uint256 salaryNet,
        string calldata name,
        bool active
    ) external {
        require(wallet != address(0), "Invalid wallet");
        require(salaryNet > 0, "Salary must be > 0");
        require(bytes(name).length > 0, "Name required");

        mapping(address => Employee) storage emps = _employees[msg.sender];
        if (emps[wallet].wallet == address(0)) {
            // New employee
            _employeeList[msg.sender].push(wallet);
        }
        emps[wallet] = Employee({ wallet: wallet, salaryNet: salaryNet, name: name, active: active });
        emit EmployeeRegistered(msg.sender, wallet, salaryNet, name);
    }

    function updateEmployee(
        address wallet,
        uint256 salaryNet,
        string calldata name,
        bool active
    ) external {
        require(_employees[msg.sender][wallet].wallet != address(0), "Employee not found");
        _employees[msg.sender][wallet] = Employee({ wallet: wallet, salaryNet: salaryNet, name: name, active: active });
        emit EmployeeUpdated(msg.sender, wallet, salaryNet, name, active);
    }

    function removeEmployee(address wallet) external {
        require(_employees[msg.sender][wallet].wallet != address(0), "Employee not found");
        delete _employees[msg.sender][wallet];
        // Remove from list
        address[] storage list = _employeeList[msg.sender];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == wallet) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
        emit EmployeeRemoved(msg.sender, wallet);
    }

    // ── Payroll ───────────────────────────────────────────────────────────────

    function runPayroll(string calldata period, uint256 startIndex, uint256 endIndex) external {
        address[] storage list = _employeeList[msg.sender];
        uint256 len = list.length;
        require(len > 0, "No employees");

        uint256 end = endIndex == 0 ? len : endIndex;
        if (end > len) end = len;
        require(startIndex < end, "Invalid range");
        require(end - startIndex <= MAX_BATCH_SIZE, "Batch too large");

        uint256 total;
        uint256 count;
        for (uint256 i = startIndex; i < end; i++) {
            Employee storage e = _employees[msg.sender][list[i]];
            if (!e.active) continue;
            _safeTransferFrom(msg.sender, e.wallet, e.salaryNet);
            total += e.salaryNet;
            count++;
        }

        uint256 runId = _runs[msg.sender].length + 1;
        _runs[msg.sender].push(PayrollRun({
            runId: runId,
            period: period,
            totalAmount: total,
            employeeCount: count,
            timestamp: block.timestamp
        }));
        _totalDisbursed[msg.sender] += total;
        emit PayrollExecuted(msg.sender, runId, period, total, count);
    }

    function runPayrollSelected(string calldata period, address[] calldata wallets) external {
        require(wallets.length > 0, "No wallets");
        require(wallets.length <= MAX_BATCH_SIZE, "Batch too large");

        uint256 total;
        uint256 count;
        for (uint256 i = 0; i < wallets.length; i++) {
            Employee storage e = _employees[msg.sender][wallets[i]];
            if (e.wallet == address(0) || !e.active) continue;
            _safeTransferFrom(msg.sender, e.wallet, e.salaryNet);
            total += e.salaryNet;
            count++;
        }

        uint256 runId = _runs[msg.sender].length + 1;
        _runs[msg.sender].push(PayrollRun({
            runId: runId,
            period: period,
            totalAmount: total,
            employeeCount: count,
            timestamp: block.timestamp
        }));
        _totalDisbursed[msg.sender] += total;
        emit PayrollExecuted(msg.sender, runId, period, total, count);
    }

    // ── Read functions ────────────────────────────────────────────────────────

    function getEmployees(address company) external view returns (Employee[] memory) {
        address[] storage list = _employeeList[company];
        uint256 len = list.length;
        Employee[] memory result = new Employee[](len);
        uint256 j;
        for (uint256 i = 0; i < len; i++) {
            Employee storage e = _employees[company][list[i]];
            if (e.wallet != address(0)) {
                result[j++] = e;
            }
        }
        // Trim
        assembly { mstore(result, j) }
        return result;
    }

    function getEmployee(address company, address wallet) external view returns (Employee memory) {
        return _employees[company][wallet];
    }

    function getActiveEmployeeCount(address company) external view returns (uint256) {
        address[] storage list = _employeeList[company];
        uint256 count;
        for (uint256 i = 0; i < list.length; i++) {
            if (_employees[company][list[i]].active) count++;
        }
        return count;
    }

    function getRunCount(address company) external view returns (uint256) {
        return _runs[company].length;
    }

    function getPayrollRun(address company, uint256 runId) external view returns (PayrollRun memory) {
        require(runId > 0 && runId <= _runs[company].length, "Run not found");
        return _runs[company][runId - 1];
    }

    function getTotalDisbursed(address company) external view returns (uint256) {
        return _totalDisbursed[company];
    }
}
