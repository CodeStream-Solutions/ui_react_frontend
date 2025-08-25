-- ================================================
-- COMPREHENSIVE DATABASE POPULATION SCRIPT
-- ================================================
-- This script populates the database with realistic test data
-- Run this after the database tables have been created
-- ================================================

-- Start transaction for data integrity
START TRANSACTION;

-- ================================================
-- 1. INSERT DEFAULT LOOKUP DATA
-- ================================================

-- Insert default roles
INSERT INTO role (Name, Description) VALUES
('Employee', 'Standard employee role with basic access'),
('Admin', 'Administrator role with full system access'),
('Warehouse Manager', 'Warehouse manager role with inventory management access')
ON DUPLICATE KEY UPDATE Description = VALUES(Description);

-- Insert default tool status types
INSERT INTO toolstatustype (StatusTypeID, Name, Description) VALUES
(1, 'Available', 'Tool is available for use'),
(2, 'In Use', 'Tool is currently being used'),
(3, 'Maintenance', 'Tool is under maintenance'),
(4, 'Retired', 'Tool is retired and no longer available'),
(5, 'Lost', 'Tool is lost or missing'),
(6, 'Broken', 'Tool is broken and needs repair')
ON DUPLICATE KEY UPDATE Description = VALUES(Description);

-- Insert default transaction types
INSERT INTO transactiontype (TypeID, Name) VALUES
(1, 'Check Out'),
(2, 'Check In'),
(3, 'Transfer'),
(4, 'Maintenance'),
(5, 'Return from Maintenance'),
(6, 'Retire'),
(7, 'Activate')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

-- Insert default tool categories
INSERT INTO toolcategory (CategoryID, Name, Description) VALUES
(1, 'Hand Tools', 'Manual hand tools'),
(2, 'Power Tools', 'Electric or battery-powered tools'),
(3, 'Measuring Tools', 'Tools for measurement and precision'),
(4, 'Safety Equipment', 'Personal protective equipment'),
(5, 'Specialty Tools', 'Specialized tools for specific tasks'),
(6, 'Electrical Tools', 'Tools for electrical work and repairs'),
(7, 'Automotive Tools', 'Tools for vehicle maintenance and repair'),
(8, 'Woodworking Tools', 'Tools for carpentry and woodworking'),
(9, 'Plumbing Tools', 'Tools for plumbing and pipe work'),
(10, 'Landscaping Tools', 'Tools for outdoor and landscaping work')
ON DUPLICATE KEY UPDATE Description = VALUES(Description);

-- ================================================
-- 2. CREATE SYSTEM USER AND EMPLOYEE
-- ================================================

-- Create system employee
INSERT INTO employee (EmployeeID, FirstName, LastName, Email, Phone, IsActive, CreatedAt) VALUES
(1, 'System', 'User', 'system@company.com', '0000000000', 1, NOW())
ON DUPLICATE KEY UPDATE 
    FirstName = VALUES(FirstName),
    LastName = VALUES(LastName),
    Email = VALUES(Email),
    Phone = VALUES(Phone),
    IsActive = VALUES(IsActive);

-- Create system user account (password: system_password)
INSERT INTO useraccount (UserID, EmployeeID, Username, PasswordHash, IsActive, CreatedAt) VALUES
(1, 1, 'system', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW())
ON DUPLICATE KEY UPDATE 
    EmployeeID = VALUES(EmployeeID),
    Username = VALUES(Username),
    PasswordHash = VALUES(PasswordHash),
    IsActive = VALUES(IsActive);

-- Assign Admin role to system user
INSERT INTO userrole (UserID, RoleID, AssignedDate) VALUES
(1, 2, NOW())  -- Admin role
ON DUPLICATE KEY UPDATE AssignedDate = VALUES(AssignedDate);

-- ================================================
-- 3. CREATE EMPLOYEES
-- ================================================

INSERT INTO employee (FirstName, LastName, Email, Phone, IsActive, CreatedAt) VALUES
('Alice', 'Johnson', 'alice.johnson@company.com', '555-0101', 1, NOW()),
('Bob', 'Smith', 'bob.smith@company.com', '555-0102', 1, NOW()),
('Carol', 'Williams', 'carol.williams@company.com', '555-0103', 1, NOW()),
('David', 'Brown', 'david.brown@company.com', '555-0104', 1, NOW()),
('Eva', 'Davis', 'eva.davis@company.com', '555-0105', 1, NOW()),
('Frank', 'Miller', 'frank.miller@company.com', '555-0106', 1, NOW()),
('Grace', 'Wilson', 'grace.wilson@company.com', '555-0107', 1, NOW()),
('Henry', 'Moore', 'henry.moore@company.com', '555-0108', 1, NOW()),
('Iris', 'Taylor', 'iris.taylor@company.com', '555-0109', 1, NOW()),
('Jack', 'Anderson', 'jack.anderson@company.com', '555-0110', 1, NOW()),
('Kate', 'Thomas', 'kate.thomas@company.com', '555-0111', 1, NOW()),
('Leo', 'Jackson', 'leo.jackson@company.com', '555-0112', 1, NOW());

-- ================================================
-- 4. CREATE USER ACCOUNTS FOR EMPLOYEES
-- ================================================

-- Create user accounts (password: TempPassword123!)
INSERT INTO useraccount (EmployeeID, Username, PasswordHash, IsActive, CreatedAt) VALUES
(2, 'alice.johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(3, 'bob.smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(4, 'carol.williams', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(5, 'david.brown', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(6, 'eva.davis', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(7, 'frank.miller', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(8, 'grace.wilson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(9, 'henry.moore', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(10, 'iris.taylor', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(11, 'jack.anderson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(12, 'kate.thomas', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW()),
(13, 'leo.jackson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKjqG', 1, NOW());

-- Assign roles to users
INSERT INTO userrole (UserID, RoleID, AssignedDate) VALUES
-- Alice gets Admin role
((SELECT UserID FROM useraccount WHERE Username = 'alice.johnson'), 2, NOW()),
-- Bob gets Warehouse Manager role
((SELECT UserID FROM useraccount WHERE Username = 'bob.smith'), 3, NOW()),
-- Eva gets Warehouse Manager role
((SELECT UserID FROM useraccount WHERE Username = 'eva.davis'), 3, NOW());

-- All other users get default Employee role
INSERT INTO userrole (UserID, RoleID, AssignedDate)
SELECT u.UserID, 1, NOW()
FROM useraccount u
WHERE u.Username NOT IN ('system', 'alice.johnson', 'bob.smith', 'eva.davis')
AND NOT EXISTS (
    SELECT 1 FROM userrole ur WHERE ur.UserID = u.UserID
);

-- ================================================
-- 5. CREATE WAREHOUSE TOOLBOX
-- ================================================

INSERT INTO toolbox (ToolboxID, Name, Description, EmployeeID, IsActive, CreatedAt) VALUES
(1, 'Warehouse', 'Central warehouse storage for tools not assigned to specific toolboxes', 1, 1, NOW())
ON DUPLICATE KEY UPDATE 
    Name = VALUES(Name),
    Description = VALUES(Description),
    EmployeeID = VALUES(EmployeeID);

-- ================================================
-- 6. CREATE PERSONAL TOOLBOXES FOR EMPLOYEES
-- ================================================

INSERT INTO toolbox (Name, Description, EmployeeID, IsActive, CreatedAt) VALUES
('Bob''s Toolbox', 'Personal toolbox for Bob Smith', 3, 1, NOW()),
('Carol''s Toolbox', 'Personal toolbox for Carol Williams', 4, 1, NOW()),
('David''s Toolbox', 'Personal toolbox for David Brown', 5, 1, NOW()),
('Eva''s Toolbox', 'Personal toolbox for Eva Davis', 6, 1, NOW()),
('Frank''s Toolbox', 'Personal toolbox for Frank Miller', 7, 1, NOW()),
('Grace''s Toolbox', 'Personal toolbox for Grace Wilson', 8, 1, NOW()),
('Henry''s Toolbox', 'Personal toolbox for Henry Moore', 9, 1, NOW()),
('Iris''s Toolbox', 'Personal toolbox for Iris Taylor', 10, 1, NOW()),
('Jack''s Toolbox', 'Personal toolbox for Jack Anderson', 11, 1, NOW()),
('Kate''s Toolbox', 'Personal toolbox for Kate Thomas', 12, 1, NOW()),
('Leo''s Toolbox', 'Personal toolbox for Leo Jackson', 13, 1, NOW());

-- Create shared/department toolboxes
INSERT INTO toolbox (Name, Description, EmployeeID, IsActive, CreatedAt) VALUES
('Maintenance Department', 'Shared tools for maintenance team', 2, 1, NOW());

-- ================================================
-- 7. CREATE TOOLS
-- ================================================

INSERT INTO tool (SerialNumber, Name, Description, CategoryID, CurrentStatus, ToolboxID, IsActive, PurchaseDate) VALUES
-- Hand Tools
('HT001', 'Hammer', '16oz claw hammer', 1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 180 DAY)),
('HT002', 'Screwdriver Set', 'Phillips and flathead set', 1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 150 DAY)),
('HT003', 'Wrench Set', 'Metric and standard wrench set', 1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 200 DAY)),
('HT004', 'Pliers', 'Needle nose pliers', 1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 120 DAY)),
('HT005', 'Utility Knife', 'Retractable utility knife', 1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 90 DAY),

-- Power Tools
('PT001', 'Cordless Drill', '18V lithium cordless drill', 2, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 365 DAY)),
('PT002', 'Circular Saw', '7.25 inch circular saw', 2, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 300 DAY)),
('PT003', 'Angle Grinder', '4.5 inch angle grinder', 2, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 250 DAY)),
('PT004', 'Impact Driver', '18V impact driver', 2, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 280 DAY)),
('PT005', 'Reciprocating Saw', 'Variable speed reciprocating saw', 2, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 220 DAY)),

-- Measuring Tools
('MT001', 'Tape Measure', '25ft tape measure', 3, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 100 DAY)),
('MT002', 'Level', '24 inch aluminum level', 3, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 80 DAY)),
('MT003', 'Digital Caliper', '6 inch digital caliper', 3, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 160 DAY)),
('MT004', 'Laser Distance Meter', '100ft laser distance meter', 3, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 400 DAY)),

-- Safety Equipment
('SE001', 'Safety Glasses', 'Clear safety glasses', 4, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
('SE002', 'Hard Hat', 'ANSI approved hard hat', 4, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 120 DAY)),
('SE003', 'Work Gloves', 'Cut resistant work gloves', 4, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 45 DAY)),
('SE004', 'Respirator', 'N95 respirator mask', 4, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),

-- Electrical Tools
('ET001', 'Multimeter', 'Digital multimeter', 6, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 240 DAY)),
('ET002', 'Wire Strippers', 'Automatic wire strippers', 6, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 180 DAY)),
('ET003', 'Voltage Tester', 'Non-contact voltage tester', 6, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 150 DAY)),

-- Automotive Tools
('AT001', 'Socket Set', '1/4 and 3/8 drive socket set', 7, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 320 DAY)),
('AT002', 'Torque Wrench', '3/8 drive torque wrench', 7, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 280 DAY)),
('AT003', 'Oil Filter Wrench', 'Adjustable oil filter wrench', 7, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 200 DAY)),

-- Woodworking Tools
('WT001', 'Chisel Set', 'Wood chisel set', 8, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 190 DAY)),
('WT002', 'Router', 'Variable speed wood router', 8, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 350 DAY)),
('WT003', 'Clamps', 'F-clamp set', 8, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 140 DAY)),

-- Plumbing Tools
('PL001', 'Pipe Wrench', '14 inch pipe wrench', 9, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 260 DAY)),
('PL002', 'Plunger', 'Heavy duty plunger', 9, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 70 DAY)),
('PL003', 'Pipe Cutter', 'Copper pipe cutter', 9, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 180 DAY)),

-- Landscaping Tools
('LT001', 'Hedge Trimmer', 'Electric hedge trimmer', 10, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 290 DAY)),
('LT002', 'Leaf Blower', 'Gas powered leaf blower', 10, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 330 DAY)),
('LT003', 'Pruning Shears', 'Bypass pruning shears', 10, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 110 DAY));

-- ================================================
-- 8. CREATE TRANSACTIONS
-- ================================================

-- Checkout transactions
INSERT INTO tooltransaction (ToolID, PerformedBy, TransactionTypeID, FromToolboxID, ToToolboxID, ToStatus, TransactionDate, ExpectedReturnDate, Comments) VALUES
-- Hammer to Alice (Maintenance Department)
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT001'), 1, 1, 1, 13, 2, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Checked out for project work - expected return in 7 days'),
-- Screwdriver to Bob
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT002'), 1, 1, 1, 2, 2, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'Checked out for project work - expected return in 14 days'),
-- Drill to Carol
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT001'), 1, 1, 1, 3, 2, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 'Checked out for project work - expected return in 3 days'),
-- Circular Saw to David
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT002'), 1, 1, 1, 4, 2, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'Checked out for project work - expected return in 10 days'),
-- Tape Measure to Eva
((SELECT ToolID FROM tool WHERE SerialNumber = 'MT001'), 1, 1, 1, 5, 2, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 'Checked out for project work - expected return in 5 days'),
-- Hard Hat to Frank
((SELECT ToolID FROM tool WHERE SerialNumber = 'SE002'), 1, 1, 1, 6, 2, NOW(), DATE_ADD(NOW(), INTERVAL 21 DAY), 'Checked out for project work - expected return in 21 days'),
-- Multimeter to Grace
((SELECT ToolID FROM tool WHERE SerialNumber = 'ET001'), 1, 1, 1, 7, 2, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Checked out for project work - expected return in 7 days'),
-- Socket Set to Henry
((SELECT ToolID FROM tool WHERE SerialNumber = 'AT001'), 1, 1, 1, 8, 2, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'Checked out for project work - expected return in 14 days');

-- Transfer transactions
INSERT INTO tooltransaction (ToolID, PerformedBy, TransactionTypeID, FromToolboxID, ToToolboxID, ToStatus, TransactionDate, Comments) VALUES
-- Hammer transferred from Alice to Carol
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT001'), 1, 3, 13, 3, 2, NOW(), 'Transferred from Maintenance Department to Carol''s Toolbox for collaboration'),
-- Screwdriver transferred from Bob to David
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT002'), 1, 3, 2, 4, 2, NOW(), 'Transferred from Bob''s Toolbox to David''s Toolbox for collaboration');

-- Maintenance transactions
INSERT INTO tooltransaction (ToolID, PerformedBy, TransactionTypeID, FromToolboxID, ToStatus, TransactionDate, ExpectedReturnDate, Comments) VALUES
-- Screwdriver Set sent for maintenance
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT002'), 1, 4, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'Scheduled maintenance for Screwdriver Set - routine service'),
-- Angle Grinder sent for maintenance
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT003'), 1, 4, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 12 DAY), 'Scheduled maintenance for Angle Grinder - routine service'),
-- Level sent for maintenance
((SELECT ToolID FROM tool WHERE SerialNumber = 'MT002'), 1, 4, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY), 'Scheduled maintenance for Level - routine service');

-- Check-in transactions
INSERT INTO tooltransaction (ToolID, PerformedBy, TransactionTypeID, FromEmployeeID, ToToolboxID, ToStatus, TransactionDate, Comments) VALUES
-- Utility Knife checked in from Eva
((SELECT ToolID FROM tool WHERE SerialNumber = 'HT005'), 1, 2, 6, 1, 1, NOW(), 'Project completed - returning to warehouse'),
-- Impact Driver checked in from Bob
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT004'), 1, 2, 3, 1, 1, NOW(), 'Project completed - returning to warehouse');

-- ================================================
-- 9. CREATE TOOL ISSUES
-- ================================================

INSERT INTO toolissue (ToolID, ReportedByUserID, IssueType, Priority, Title, Description, Status, ReportedAt) VALUES
-- Drill issue
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT001'), 
 (SELECT UserID FROM useraccount WHERE Username = 'carol.williams'), 
 'malfunction', 'high', 
 'Drill chuck not gripping properly', 
 'The chuck on the cordless drill is not gripping drill bits securely. Bits slip during operation.'),

-- Circular Saw issue
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT002'), 
 (SELECT UserID FROM useraccount WHERE Username = 'david.brown'), 
 'safety', 'critical', 
 'Safety guard damaged', 
 'The blade guard on the circular saw is cracked and not retracting properly. Safety hazard.'),

-- Multimeter issue
((SELECT ToolID FROM tool WHERE SerialNumber = 'ET001'), 
 (SELECT UserID FROM useraccount WHERE Username = 'grace.wilson'), 
 'damage', 'medium', 
 'Display screen cracked', 
 'The LCD display on the multimeter has a crack across it, making readings difficult to see.'),

-- Impact Driver issue
((SELECT ToolID FROM tool WHERE SerialNumber = 'PT004'), 
 (SELECT UserID FROM useraccount WHERE Username = 'bob.smith'), 
 'malfunction', 'low', 
 'Battery not holding charge', 
 'The battery for the impact driver is not holding a charge for very long. May need replacement.'),

-- Router issue
((SELECT ToolID FROM tool WHERE SerialNumber = 'WT002'), 
 (SELECT UserID FROM useraccount WHERE Username = 'henry.moore'), 
 'missing', 'medium', 
 'Router base plate missing', 
 'The base plate for the wood router is missing. Tool cannot be used safely without it.');

-- ================================================
-- 10. UPDATE TOOL STATUSES BASED ON TRANSACTIONS
-- ================================================

-- Update tools that are checked out to show "In Use" status
UPDATE tool t
JOIN tooltransaction tt ON t.ToolID = tt.ToolID
JOIN (
    SELECT ToolID, MAX(TransactionID) as MaxTransID
    FROM tooltransaction
    GROUP BY ToolID
) latest ON tt.ToolID = latest.ToolID AND tt.TransactionID = latest.MaxTransID
SET t.CurrentStatus = tt.ToStatus, t.ToolboxID = tt.ToToolboxID
WHERE tt.TransactionTypeID IN (1, 3) AND tt.ToStatus = 2;

-- Update tools that are in maintenance
UPDATE tool t
JOIN tooltransaction tt ON t.ToolID = tt.ToolID
JOIN (
    SELECT ToolID, MAX(TransactionID) as MaxTransID
    FROM tooltransaction
    GROUP BY ToolID
) latest ON tt.ToolID = latest.ToolID AND tt.TransactionID = latest.MaxTransID
SET t.CurrentStatus = tt.ToStatus
WHERE tt.TransactionTypeID = 4 AND tt.ToStatus = 3;

-- ================================================
-- 11. CREATE AUDIT LOG ENTRIES FOR MAJOR OPERATIONS
-- ================================================

-- Note: In a real implementation, these would be created automatically by triggers
-- For this script, we'll create some sample audit entries
INSERT INTO auditlog (TableName, PKValue, Operation, ChangedBy, ChangedAt, ChangedData) VALUES
('employee', '2', 'INSERT', 1, NOW(), '{"FirstName": "Alice", "LastName": "Johnson", "Email": "alice.johnson@company.com"}'),
('tool', '1', 'INSERT', 1, NOW(), '{"SerialNumber": "HT001", "Name": "Hammer", "CategoryID": 1}'),
('tooltransaction', '1', 'INSERT', 1, NOW(), '{"ToolID": 1, "TransactionTypeID": 1, "FromToolboxID": 1, "ToToolboxID": 13}');

-- ================================================
-- 12. FINAL COMMIT AND SUMMARY
-- ================================================

COMMIT;

-- Display summary of created data
SELECT 'DATABASE POPULATION SUMMARY' as Summary;
SELECT '================================' as Separator;

SELECT 'Employees Created' as Item, COUNT(*) as Count FROM employee WHERE EmployeeID > 1;
SELECT 'User Accounts Created' as Item, COUNT(*) as Count FROM useraccount WHERE UserID > 1;
SELECT 'Toolboxes Created' as Item, COUNT(*) as Count FROM toolbox WHERE ToolboxID > 1;
SELECT 'Tools Created' as Item, COUNT(*) as Count FROM tool;
SELECT 'Categories Created' as Item, COUNT(*) as Count FROM toolcategory;
SELECT 'Transaction Types Created' as Item, COUNT(*) as Count FROM transactiontype;
SELECT 'Tool Status Types Created' as Item, COUNT(*) as Count FROM toolstatustype;
SELECT 'Roles Created' as Item, COUNT(*) as Count FROM role;
SELECT 'Transactions Created' as Item, COUNT(*) as Count FROM tooltransaction;
SELECT 'Tool Issues Created' as Item, COUNT(*) as Count FROM toolissue;

SELECT '================================' as Separator;
SELECT 'Database population completed successfully!' as Status;
SELECT 'You can now test the application with realistic data.' as Message;


INSERT INTO toolbox (Name, Description, EmployeeID, IsActive, IsRetired, CreatedAt) VALUES
('Bob''s Toolbox', 'Personal toolbox for Bob Smith', 3, 1, 0, NOW()),
('Carol''s Toolbox', 'Personal toolbox for Carol Williams', 4, 1, 0, NOW()),
('David''s Toolbox', 'Personal toolbox for David Brown', 5, 1, 0, NOW()),
('Eva''s Toolbox', 'Personal toolbox for Eva Davis', 6, 1, 0, NOW()),
('Frank''s Toolbox', 'Personal toolbox for Frank Miller', 7, 1, 0, NOW()),
('Grace''s Toolbox', 'Personal toolbox for Grace Wilson', 8, 1, 0, NOW()),
('Henry''s Toolbox', 'Personal toolbox for Henry Moore', 9, 1, 0, NOW()),
('Iris''s Toolbox', 'Personal toolbox for Iris Taylor', 10, 1, 0, NOW()),
('Jack''s Toolbox', 'Personal toolbox for Jack Anderson', 11, 1, 0, NOW()),
('Kate''s Toolbox', 'Personal toolbox for Kate Thomas', 12, 1, 0, NOW()),
('Leo''s Toolbox', 'Personal toolbox for Leo Jackson', 13, 1, 0, NOW());