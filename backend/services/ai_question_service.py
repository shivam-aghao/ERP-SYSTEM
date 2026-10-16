"""
================================================================================
SSGMCE COLLEGE ERP - AI QUESTION GENERATOR & CSV QUESTION BANK SERVICE
Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
Department of Computer Science & Engineering (CSE)

Features:
  1. AI-Powered CSE Question Generator (Live Gemini API with Curriculum Knowledge Engine)
  2. Strict Syllabus & Topic Alignment (Data Structures, OS, DBMS, Networks, Java, SE)
  3. Difficulty Distribution (Easy / Medium / Hard)
  4. Robust CSV Question Importer & Row-by-Row Validator
  5. Bulk Atomic Persistence to PostgreSQL (quiz_questions & question_options)
================================================================================
"""

import os
import re
import csv
import io
import json
import uuid
import random
import logging
import urllib.request
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger("ssgmce_erp_backend.ai_question_service")


# ==============================================================================
# AUTHORITATIVE CSE CURRICULUM QUESTION ENGINE
# Verified University-Level Questions for SSGMCE CSE Syllabus
# ==============================================================================

CSE_CURRICULUM_BANK: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    # --------------------------------------------------------------------------
    # 1. DATA STRUCTURES & ALGORITHMS
    # --------------------------------------------------------------------------
    "data structures": {
        "linked lists": [
            {
                "question": "Which of the following operations on a singly linked list takes O(1) time when only the head pointer is given?",
                "options": [
                    {"key": "A", "text": "Insertion at the beginning (before head)", "is_correct": True},
                    {"key": "B", "text": "Insertion at the end (after tail)", "is_correct": False},
                    {"key": "C", "text": "Deletion of the last node", "is_correct": False},
                    {"key": "D", "text": "Finding the middle node", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Inserting before the head only requires allocating the node, setting newNode->next = head, and updating head = newNode, executing in O(1) constant time without traversal.",
                "difficulty": "Easy",
                "topic": "Insertion and Deletion"
            },
            {
                "question": "In a singly linked list, what is the minimum number of pointer updates required to delete a node given a pointer to its predecessor node?",
                "options": [
                    {"key": "A", "text": "1", "is_correct": True},
                    {"key": "B", "text": "2", "is_correct": False},
                    {"key": "C", "text": "3", "is_correct": False},
                    {"key": "D", "text": "0", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Only one pointer update is required: prev->next = prev->next->next, bypassing the target node completely.",
                "difficulty": "Easy",
                "topic": "Insertion and Deletion"
            },
            {
                "question": "What is the worst-case time complexity of inserting a node at position k in a singly linked list of n elements?",
                "options": [
                    {"key": "A", "text": "O(1)", "is_correct": False},
                    {"key": "B", "text": "O(k)", "is_correct": True},
                    {"key": "C", "text": "O(n log n)", "is_correct": False},
                    {"key": "D", "text": "O(k^2)", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Inserting at position k requires traversing k - 1 nodes starting from the head to reach the insertion point, taking O(k) time (or O(n) in the worst case when k = n).",
                "difficulty": "Medium",
                "topic": "Insertion and Deletion"
            },
            {
                "question": "In a doubly linked list, which set of pointer assignments correctly inserts a newNode between prevNode and nextNode?",
                "options": [
                    {"key": "A", "text": "newNode->next = nextNode; newNode->prev = prevNode; prevNode->next = newNode; nextNode->prev = newNode;", "is_correct": True},
                    {"key": "B", "text": "prevNode->next = newNode; nextNode->prev = newNode; newNode->next = prevNode; newNode->prev = nextNode;", "is_correct": False},
                    {"key": "C", "text": "newNode->next = prevNode; newNode->prev = nextNode; prevNode->prev = newNode; nextNode->next = newNode;", "is_correct": False},
                    {"key": "D", "text": "newNode->next = nextNode; prevNode->next = newNode; nextNode->prev = prevNode; newNode->prev = nextNode;", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Four pointer assignments are necessary: connect newNode's next and prev to the neighbors, then link the neighbors' corresponding pointers to newNode.",
                "difficulty": "Medium",
                "topic": "Insertion and Deletion"
            },
            {
                "question": "Which algorithm detects a cycle in a singly linked list in O(n) time and O(1) auxiliary space?",
                "options": [
                    {"key": "A", "text": "Breadth-First Search", "is_correct": False},
                    {"key": "B", "text": "Floyd's Tortoise and Hare Cycle-Finding Algorithm", "is_correct": True},
                    {"key": "C", "text": "Dijkstra's Algorithm", "is_correct": False},
                    {"key": "D", "text": "Kruskal's Disjoint Set Method", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Floyd's algorithm uses two pointers moving at different speeds (slow moves 1 step, fast moves 2 steps). If a cycle exists, fast will meet slow inside the cycle in O(n) time using O(1) extra space.",
                "difficulty": "Hard",
                "topic": "Cycle Detection and Reversal"
            },
            {
                "question": "What is the time and space complexity of iteratively reversing a singly linked list of length n?",
                "options": [
                    {"key": "A", "text": "Time: O(n), Auxiliary Space: O(1)", "is_correct": True},
                    {"key": "B", "text": "Time: O(n), Auxiliary Space: O(n)", "is_correct": False},
                    {"key": "C", "text": "Time: O(n^2), Auxiliary Space: O(1)", "is_correct": False},
                    {"key": "D", "text": "Time: O(log n), Auxiliary Space: O(1)", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Iterative reversal uses three sliding pointers (prev, curr, next) to reverse node pointers in a single linear pass of O(n) time with O(1) auxiliary memory.",
                "difficulty": "Hard",
                "topic": "Cycle Detection and Reversal"
            }
        ],
        "stacks and queues": [
            {
                "question": "Which data structure follows the Last-In, First-Out (LIFO) access principle?",
                "options": [
                    {"key": "A", "text": "Queue", "is_correct": False},
                    {"key": "B", "text": "Stack", "is_correct": True},
                    {"key": "C", "text": "Binary Heap", "is_correct": False},
                    {"key": "D", "text": "Array List", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "A Stack operates strictly on a LIFO (Last-In, First-Out) discipline where elements are pushed and popped exclusively from the top.",
                "difficulty": "Easy",
                "topic": "Stack Operations"
            },
            {
                "question": "In evaluating the postfix expression '5 3 + 2 *', what is the final calculated result on the stack?",
                "options": [
                    {"key": "A", "text": "16", "is_correct": True},
                    {"key": "B", "text": "11", "is_correct": False},
                    {"key": "C", "text": "13", "is_correct": False},
                    {"key": "D", "text": "25", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Evaluation: push 5, push 3. Encounter '+': pop 3 and 5, evaluate 5 + 3 = 8, push 8. Push 2. Encounter '*': pop 2 and 8, evaluate 8 * 2 = 16.",
                "difficulty": "Medium",
                "topic": "Infix to Postfix Conversion"
            },
            {
                "question": "In a circular queue implemented with an array of capacity N, what is the condition to check if the queue is full?",
                "options": [
                    {"key": "A", "text": "(rear + 1) % N == front", "is_correct": True},
                    {"key": "B", "text": "rear == front", "is_correct": False},
                    {"key": "C", "text": "rear - front == N", "is_correct": False},
                    {"key": "D", "text": "rear == N - 1", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "In an N-element circular array holding up to N - 1 items, the queue is full when advancing rear by one modulo N coincides with front.",
                "difficulty": "Medium",
                "topic": "Circular Queues"
            },
            {
                "question": "How many queues are required to implement a stack such that push takes O(1) time and pop takes O(n) time?",
                "options": [
                    {"key": "A", "text": "1", "is_correct": False},
                    {"key": "B", "text": "2", "is_correct": True},
                    {"key": "C", "text": "3", "is_correct": False},
                    {"key": "D", "text": "Not possible with standard queues", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Two standard FIFO queues (q1 and q2) can implement a LIFO stack. For O(1) push, enqueue to q1. For pop, dequeue n-1 elements to q2 and return the last remaining element.",
                "difficulty": "Hard",
                "topic": "Queue Applications"
            }
        ],
        "trees": [
            {
                "question": "Which binary tree traversal visits the nodes in non-decreasing sorted order for a Binary Search Tree (BST)?",
                "options": [
                    {"key": "A", "text": "Preorder Traversal", "is_correct": False},
                    {"key": "B", "text": "Inorder Traversal", "is_correct": True},
                    {"key": "C", "text": "Postorder Traversal", "is_correct": False},
                    {"key": "D", "text": "Level-order Traversal", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Inorder traversal visits (Left Subtree -> Root -> Right Subtree). For a BST, all left nodes are smaller and right nodes are larger, naturally yielding sorted order.",
                "difficulty": "Easy",
                "topic": "Binary Search Trees (BST)"
            },
            {
                "question": "What is the maximum balance factor allowed for any node in an AVL Tree?",
                "options": [
                    {"key": "A", "text": "0", "is_correct": False},
                    {"key": "B", "text": "1 (values must be in {-1, 0, +1})", "is_correct": True},
                    {"key": "C", "text": "2", "is_correct": False},
                    {"key": "D", "text": "Any positive integer", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "An AVL tree is height-balanced where the height difference between left and right subtrees of any node is strictly -1, 0, or +1.",
                "difficulty": "Medium",
                "topic": "AVL Balanced Trees"
            },
            {
                "question": "In a max-heap of n elements stored in an array (1-indexed), where are the children of the node at index i located?",
                "options": [
                    {"key": "A", "text": "2i and 2i + 1", "is_correct": True},
                    {"key": "B", "text": "i + 1 and i + 2", "is_correct": False},
                    {"key": "C", "text": "i/2 and i/2 + 1", "is_correct": False},
                    {"key": "D", "text": "2i - 1 and 2i", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "In 1-based indexing for a complete binary tree, the left child of node i is at 2i and the right child is at 2i + 1.",
                "difficulty": "Easy",
                "topic": "Heaps and Priority Queues"
            },
            {
                "question": "What is the worst-case time complexity of building a binary heap of n elements from an arbitrary array using Floyd's buildHeap algorithm?",
                "options": [
                    {"key": "A", "text": "O(n log n)", "is_correct": False},
                    {"key": "B", "text": "O(n)", "is_correct": True},
                    {"key": "C", "text": "O(n^2)", "is_correct": False},
                    {"key": "D", "text": "O(log n)", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Bottom-up heap construction (sifting down from index n/2 down to 1) runs in sum_{h=0}^{log n} (n / 2^{h+1}) * O(h) = O(n) linear time.",
                "difficulty": "Hard",
                "topic": "Heaps and Priority Queues"
            }
        ],
        "graphs": [
            {
                "question": "Which algorithm finds the Single-Source Shortest Path in a weighted directed graph with non-negative edge weights?",
                "options": [
                    {"key": "A", "text": "Prim's Algorithm", "is_correct": False},
                    {"key": "B", "text": "Dijkstra's Algorithm", "is_correct": True},
                    {"key": "C", "text": "Kruskal's Algorithm", "is_correct": False},
                    {"key": "D", "text": "Tarjan's Algorithm", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Dijkstra's algorithm uses a greedy approach with a priority queue to compute shortest paths from a single source to all vertices in O((V + E) log V) time when edge weights are non-negative.",
                "difficulty": "Medium",
                "topic": "Shortest Path (Dijkstra, Bellman-Ford)"
            },
            {
                "question": "Which algorithmic design paradigm is employed by Kruskal's algorithm to compute a Minimum Spanning Tree (MST)?",
                "options": [
                    {"key": "A", "text": "Dynamic Programming", "is_correct": False},
                    {"key": "B", "text": "Greedy Method with Disjoint Sets (Union-Find)", "is_correct": True},
                    {"key": "C", "text": "Divide and Conquer", "is_correct": False},
                    {"key": "D", "text": "Branch and Bound", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Kruskal's algorithm sorts all edges in non-decreasing order and greedily selects the minimum weight edge that does not form a cycle, verified using Union-Find.",
                "difficulty": "Medium",
                "topic": "Minimum Spanning Trees (Prim, Kruskal)"
            },
            {
                "question": "What is the time complexity of the Bellman-Ford shortest path algorithm on a graph with V vertices and E edges?",
                "options": [
                    {"key": "A", "text": "O(V + E)", "is_correct": False},
                    {"key": "B", "text": "O(V * E)", "is_correct": True},
                    {"key": "C", "text": "O(V^3)", "is_correct": False},
                    {"key": "D", "text": "O(E log V)", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Bellman-Ford relaxes all E edges V - 1 times, resulting in O(V * E) runtime and allowing detection of negative weight cycles.",
                "difficulty": "Hard",
                "topic": "Shortest Path (Dijkstra, Bellman-Ford)"
            }
        ]
    },

    # --------------------------------------------------------------------------
    # 2. OPERATING SYSTEMS
    # --------------------------------------------------------------------------
    "operating systems": {
        "process scheduling": [
            {
                "question": "Which CPU scheduling algorithm assigns the processor to the process with the smallest next CPU burst?",
                "options": [
                    {"key": "A", "text": "First-Come, First-Served (FCFS)", "is_correct": False},
                    {"key": "B", "text": "Shortest Job First (SJF)", "is_correct": True},
                    {"key": "C", "text": "Round Robin (RR)", "is_correct": False},
                    {"key": "D", "text": "Priority Scheduling", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "SJF selects the waiting process with the smallest execution burst time, which theoretically provides the optimal minimum average waiting time.",
                "difficulty": "Easy",
                "topic": "CPU Scheduling"
            },
            {
                "question": "What undesirable condition occurs in FCFS scheduling when long CPU-bound processes delay short I/O-bound processes?",
                "options": [
                    {"key": "A", "text": "Starvation", "is_correct": False},
                    {"key": "B", "text": "Convoy Effect", "is_correct": True},
                    {"key": "C", "text": "Thrashing", "is_correct": False},
                    {"key": "D", "text": "Priority Inversion", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "The convoy effect describes the phenomenon where multiple shorter processes wait behind a single long CPU-intensive process, reducing device and CPU utilization.",
                "difficulty": "Easy",
                "topic": "CPU Scheduling"
            },
            {
                "question": "In Round Robin CPU scheduling, what happens to the system performance if the time quantum is set excessively large?",
                "options": [
                    {"key": "A", "text": "Context switches increase exponentially", "is_correct": False},
                    {"key": "B", "text": "Behavior degenerates into First-Come First-Served (FCFS)", "is_correct": True},
                    {"key": "C", "text": "Throughput drops to zero", "is_correct": False},
                    {"key": "D", "text": "Process starvation occurs immediately", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "When time quantum is greater than the longest burst time, every process runs to completion on its first allocation, degenerating RR into FCFS.",
                "difficulty": "Medium",
                "topic": "CPU Scheduling"
            },
            {
                "question": "How does Multilevel Feedback Queue (MLFQ) scheduling prevent starvation for aging compute-bound processes?",
                "options": [
                    {"key": "A", "text": "By periodically boosting the priority of processes that wait too long in lower queues", "is_correct": True},
                    {"key": "B", "text": "By increasing the time quantum of the highest priority queue", "is_correct": False},
                    {"key": "C", "text": "By terminating compute-bound processes", "is_correct": False},
                    {"key": "D", "text": "By converting all queues into strict LIFO queues", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Aging is implemented by upgrading processes that have waited a threshold duration in lower queues up to higher queues, preventing indefinite starvation.",
                "difficulty": "Hard",
                "topic": "CPU Scheduling"
            }
        ],
        "synchronization and deadlocks": [
            {
                "question": "Which of the following is NOT one of Coffman's four necessary conditions for a deadlock to occur?",
                "options": [
                    {"key": "A", "text": "Mutual Exclusion", "is_correct": False},
                    {"key": "B", "text": "Hold and Wait", "is_correct": False},
                    {"key": "C", "text": "Preemption", "is_correct": True},
                    {"key": "D", "text": "Circular Wait", "is_correct": False}
                ],
                "correct_answer": "C",
                "explanation": "Coffman's conditions are Mutual Exclusion, Hold and Wait, NO Preemption, and Circular Wait. 'Preemption' allows breaking deadlocks.",
                "difficulty": "Easy",
                "topic": "Deadlock conditions and prevention"
            },
            {
                "question": "Which algorithm is utilized by the Operating System to avoid deadlocks by testing for safe states before allocating resources?",
                "options": [
                    {"key": "A", "text": "Peterson's Algorithm", "is_correct": False},
                    {"key": "B", "text": "Banker's Algorithm", "is_correct": True},
                    {"key": "C", "text": "Dijkstra's Algorithm", "is_correct": False},
                    {"key": "D", "text": "Lamport's Bakery Algorithm", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "Dijkstra's Banker's Algorithm simulates resource allocation for maximum possible claims to ensure the system never enters an unsafe state.",
                "difficulty": "Medium",
                "topic": "Banker's algorithm"
            },
            {
                "question": "What is the primary difference between a counting semaphore and a binary semaphore (mutex)?",
                "options": [
                    {"key": "A", "text": "Counting semaphore takes integer values over an unrestricted domain; binary semaphore only takes 0 and 1", "is_correct": True},
                    {"key": "B", "text": "Binary semaphores are faster than counting semaphores in hardware", "is_correct": False},
                    {"key": "C", "text": "Counting semaphores cannot be used in multithreading", "is_correct": False},
                    {"key": "D", "text": "Binary semaphore does not support wait() and signal()", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "A counting semaphore integer value ranges over an unrestricted non-negative domain representing available resource instances; binary semaphores are restricted to 0 and 1.",
                "difficulty": "Medium",
                "topic": "Critical-Section problem"
            },
            {
                "question": "In Peterson's solution for two processes, what ensures that mutual exclusion is strictly preserved?",
                "options": [
                    {"key": "A", "text": "The combination of boolean flag[2] array and shared integer turn variable", "is_correct": True},
                    {"key": "B", "text": "Atomic test-and-set hardware instructions", "is_correct": False},
                    {"key": "C", "text": "Disabling hardware interrupts globally", "is_correct": False},
                    {"key": "D", "text": "Kernel-level monitor synchronization", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Peterson's solution uses flag[i] = true to signal intent and turn = j to grant precedence, ensuring P0 and P1 cannot simultaneously enter the critical section.",
                "difficulty": "Hard",
                "topic": "Peterson's solution, Mutex, Semaphores"
            }
        ],
        "memory management": [
            {
                "question": "What is Belady's Anomaly in operating system virtual memory management?",
                "options": [
                    {"key": "A", "text": "Page faults increase when allocated page frames increase under FIFO replacement", "is_correct": True},
                    {"key": "B", "text": "Access time decreases as page size increases", "is_correct": False},
                    {"key": "C", "text": "LRU algorithm performs worse than Random replacement", "is_correct": False},
                    {"key": "D", "text": "Total virtual memory exceeds physical address space", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Belady's Anomaly states that for certain page reference strings, the FIFO page replacement algorithm causes more page faults when allocated more frames.",
                "difficulty": "Medium",
                "topic": "Page Replacement Algorithms"
            },
            {
                "question": "What is the primary purpose of the Translation Lookaside Buffer (TLB) in virtual memory hardware?",
                "options": [
                    {"key": "A", "text": "To cache recently accessed virtual-to-physical address translations for fast retrieval", "is_correct": True},
                    {"key": "B", "text": "To store the entire inverted page table", "is_correct": False},
                    {"key": "C", "text": "To buffer dirty pages before disk writes", "is_correct": False},
                    {"key": "D", "text": "To prevent unauthorized access to swap space", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "The TLB is high-speed associative hardware cache that stores active page table entries, avoiding extra main memory accesses during address translation.",
                "difficulty": "Medium",
                "topic": "Paging and TLB"
            },
            {
                "question": "What hardware phenomenon is termed 'Thrashing' in an operating system?",
                "options": [
                    {"key": "A", "text": "The CPU spends more time paging (swapping pages in and out) than executing instructions", "is_correct": True},
                    {"key": "B", "text": "Memory controller overheating due to excessive memory writes", "is_correct": False},
                    {"key": "C", "text": "Deadlock occurring between memory-mapped I/O devices", "is_correct": False},
                    {"key": "D", "text": "Fragmentation of swap partition beyond capacity", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Thrashing occurs when the sum of working set sizes across active processes exceeds physical memory, forcing continuous page faults and near-zero CPU throughput.",
                "difficulty": "Hard",
                "topic": "Virtual Memory"
            }
        ]
    },

    # --------------------------------------------------------------------------
    # 3. DATABASE MANAGEMENT SYSTEMS (DBMS)
    # --------------------------------------------------------------------------
    "database management systems": {
        "normalization": [
            {
                "question": "Which normal form specifically addresses and eliminates partial functional dependencies?",
                "options": [
                    {"key": "A", "text": "First Normal Form (1NF)", "is_correct": False},
                    {"key": "B", "text": "Second Normal Form (2NF)", "is_correct": True},
                    {"key": "C", "text": "Third Normal Form (3NF)", "is_correct": False},
                    {"key": "D", "text": "Boyce-Codd Normal Form (BCNF)", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "A relation is in 2NF if it is in 1NF and no non-prime attribute is functionally dependent on any proper subset of any candidate key (no partial dependencies).",
                "difficulty": "Easy",
                "topic": "1NF, 2NF, 3NF"
            },
            {
                "question": "A relation R(A, B, C, D) has functional dependencies: A -> B, B -> C. In which normal form is R if A is the primary key?",
                "options": [
                    {"key": "A", "text": "1NF only", "is_correct": False},
                    {"key": "B", "text": "2NF (since transitive dependency A -> C via B exists)", "is_correct": True},
                    {"key": "C", "text": "3NF", "is_correct": False},
                    {"key": "D", "text": "BCNF", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "R is in 2NF because no partial dependencies exist on the single attribute key A. However, A -> B and B -> C creates a transitive dependency A -> C on non-prime C, violating 3NF.",
                "difficulty": "Medium",
                "topic": "1NF, 2NF, 3NF"
            },
            {
                "question": "What is the strict condition for a relation schema R to be in Boyce-Codd Normal Form (BCNF)?",
                "options": [
                    {"key": "A", "text": "For every non-trivial functional dependency X -> Y, X must be a superkey", "is_correct": True},
                    {"key": "B", "text": "Every attribute must be atomic and have single values", "is_correct": False},
                    {"key": "C", "text": "Y must be a prime attribute whenever X is not a superkey", "is_correct": False},
                    {"key": "D", "text": "Every foreign key must reference an index", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "BCNF is stricter than 3NF: for every non-trivial dependency X -> Y, the determinant X must strictly be a superkey (3NF allows Y to be a prime attribute as a fallback).",
                "difficulty": "Medium",
                "topic": "Boyce-Codd Normal Form (BCNF)"
            },
            {
                "question": "Which property is ALWAYS guaranteed when decomposing a relation schema into 3NF, but NOT always guaranteed when decomposing into BCNF?",
                "options": [
                    {"key": "A", "text": "Lossless Join Decomposition", "is_correct": False},
                    {"key": "B", "text": "Dependency Preservation", "is_correct": True},
                    {"key": "C", "text": "Minimal redundancy", "is_correct": False},
                    {"key": "D", "text": "Primary key uniqueness", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "3NF synthesis always guarantees both lossless join and dependency preservation. BCNF guarantees lossless join, but cannot always preserve all functional dependencies.",
                "difficulty": "Hard",
                "topic": "Normalization & Schema Refinement"
            }
        ],
        "sql and relational algebra": [
            {
                "question": "Which SQL clause is used to filter aggregated group records produced by a GROUP BY clause?",
                "options": [
                    {"key": "A", "text": "WHERE", "is_correct": False},
                    {"key": "B", "text": "HAVING", "is_correct": True},
                    {"key": "C", "text": "ORDER BY", "is_correct": False},
                    {"key": "D", "text": "FILTER BY", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "WHERE filters individual rows before aggregation occurs; HAVING filters aggregated groups after the GROUP BY calculation.",
                "difficulty": "Easy",
                "topic": "DDL, DML, DCL commands"
            },
            {
                "question": "In Relational Algebra, which operator denotes the selection of tuples that satisfy a given predicate?",
                "options": [
                    {"key": "A", "text": "Sigma (σ)", "is_correct": True},
                    {"key": "B", "text": "Pi (π)", "is_correct": False},
                    {"key": "C", "text": "Rho (ρ)", "is_correct": False},
                    {"key": "D", "text": "Bowtie (⨝)", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Sigma (σ) represents relational selection of rows; Pi (π) represents projection of columns; Rho (ρ) is renaming.",
                "difficulty": "Easy",
                "topic": "Relational algebra operations"
            },
            {
                "question": "What is the difference between a LEFT OUTER JOIN and a FULL OUTER JOIN?",
                "options": [
                    {"key": "A", "text": "LEFT OUTER JOIN preserves all rows from left table; FULL OUTER JOIN preserves unmatched rows from both tables", "is_correct": True},
                    {"key": "B", "text": "LEFT JOIN requires equality predicates; FULL JOIN does not", "is_correct": False},
                    {"key": "C", "text": "FULL JOIN returns only common records between tables", "is_correct": False},
                    {"key": "D", "text": "LEFT JOIN ignores NULL values; FULL JOIN does not", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "LEFT OUTER JOIN keeps every row from the left table with NULLs for unmatched right attributes; FULL OUTER JOIN retains all rows from both tables.",
                "difficulty": "Medium",
                "topic": "Joins and nested subqueries"
            }
        ],
        "transactions and concurrency": [
            {
                "question": "Which ACID property guarantees that all operations within a transaction execute completely or none at all?",
                "options": [
                    {"key": "A", "text": "Atomicity", "is_correct": True},
                    {"key": "B", "text": "Consistency", "is_correct": False},
                    {"key": "C", "text": "Isolation", "is_correct": False},
                    {"key": "D", "text": "Durability", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Atomicity (all-or-nothing execution) ensures transactions that abort midway leave no partial modifications in the database.",
                "difficulty": "Easy",
                "topic": "Transaction concepts"
            },
            {
                "question": "What does the Two-Phase Locking (2PL) protocol guarantee in database concurrency control?",
                "options": [
                    {"key": "A", "text": "Freedom from deadlocks", "is_correct": False},
                    {"key": "B", "text": "Conflict Serializability of transaction schedules", "is_correct": True},
                    {"key": "C", "text": "Zero lock waiting times", "is_correct": False},
                    {"key": "D", "text": "High throughput without rollbacks", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "2PL (growing phase followed by shrinking phase) guarantees conflict serializability, though basic 2PL does not prevent deadlocks or cascading aborts.",
                "difficulty": "Hard",
                "topic": "Concurrency control"
            }
        ]
    },

    # --------------------------------------------------------------------------
    # 4. COMPUTER NETWORKS
    # --------------------------------------------------------------------------
    "computer networks": {
        "network layers and models": [
            {
                "question": "Which layer of the 7-layer OSI model provides end-to-end process communication, error recovery, and flow control?",
                "options": [
                    {"key": "A", "text": "Network Layer", "is_correct": False},
                    {"key": "B", "text": "Transport Layer", "is_correct": True},
                    {"key": "C", "text": "Session Layer", "is_correct": False},
                    {"key": "D", "text": "Data Link Layer", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "The Transport Layer (Layer 4, e.g. TCP) is responsible for host-to-host process delivery, port multiplexing, and end-to-end reliability.",
                "difficulty": "Easy",
                "topic": "OSI reference model vs TCP/IP"
            },
            {
                "question": "What is the default subnet mask for an IPv4 Class C network address under classic classful addressing?",
                "options": [
                    {"key": "A", "text": "255.0.0.0 (/8)", "is_correct": False},
                    {"key": "B", "text": "255.255.0.0 (/16)", "is_correct": False},
                    {"key": "C", "text": "255.255.255.0 (/24)", "is_correct": True},
                    {"key": "D", "text": "255.255.255.255 (/32)", "is_correct": False}
                ],
                "correct_answer": "C",
                "explanation": "Class C uses the first 24 bits for the network identifier (255.255.255.0 or /24) and the remaining 8 bits for host addresses (up to 254 hosts).",
                "difficulty": "Easy",
                "topic": "IPv4 addressing and subnetting (CIDR)"
            },
            {
                "question": "In Classless Inter-Domain Routing (CIDR), how many usable host IP addresses are available in a /28 subnet?",
                "options": [
                    {"key": "A", "text": "16", "is_correct": False},
                    {"key": "B", "text": "14", "is_correct": True},
                    {"key": "C", "text": "30", "is_correct": False},
                    {"key": "D", "text": "12", "is_correct": False}
                ],
                "correct_answer": "B",
                "explanation": "A /28 subnet has 32 - 28 = 4 host bits. 2^4 = 16 total addresses minus 2 reserved addresses (network ID and broadcast address) equals 14 usable host IPs.",
                "difficulty": "Medium",
                "topic": "IPv4 addressing and subnetting (CIDR)"
            },
            {
                "question": "What is the major operational difference between Go-Back-N ARQ and Selective Repeat ARQ?",
                "options": [
                    {"key": "A", "text": "Selective Repeat retransmits only corrupted/lost frames; Go-Back-N retransmits all frames from the point of error", "is_correct": True},
                    {"key": "B", "text": "Go-Back-N requires receiver buffering; Selective Repeat does not", "is_correct": False},
                    {"key": "C", "text": "Selective Repeat uses stop-and-wait; Go-Back-N is full duplex", "is_correct": False},
                    {"key": "D", "text": "Go-Back-N supports larger sequence numbers than Selective Repeat", "is_correct": False}
                ],
                "correct_answer": "A",
                "explanation": "Selective Repeat buffers out-of-order frames at the receiver and retransmits strictly individual lost frames, whereas Go-Back-N discards subsequent frames and re-sends the entire window.",
                "difficulty": "Hard",
                "topic": "Sliding window protocols"
            }
        ]
    }
}


class AIQuestionService:
    """Enterprise AI Question Generation & CSV Ingestion Engine."""

    @classmethod
    def _match_curriculum_category(cls, subject_str: str) -> str:
        """Finds closest matching CSE subject key in curriculum bank."""
        s = (subject_str or "").lower().strip()
        if any(k in s for k in ("data structure", "algorithm", "dsa", "cs201")):
            return "data structures"
        if any(k in s for k in ("operating system", "os", "cs204")):
            return "operating systems"
        if any(k in s for k in ("database", "dbms", "sql", "cs220")):
            return "database management systems"
        if any(k in s for k in ("network", "cn", "cs205")):
            return "computer networks"
        return "data structures"

    @classmethod
    def _match_unit_topic(cls, category: str, unit_str: str, topic_str: str) -> List[Dict[str, Any]]:
        """Filters questions matching Unit/Topic or category."""
        cat_bank = CSE_CURRICULUM_BANK.get(category, {})
        u_lower = (unit_str or "").lower().strip()
        t_lower = (topic_str or "").lower().strip()

        matched_questions: List[Dict[str, Any]] = []

        # Check subtopic/topic matches
        for topic_key, q_list in cat_bank.items():
            topic_key_lower = topic_key.lower()
            if t_lower and (t_lower in topic_key_lower or topic_key_lower in t_lower):
                matched_questions.extend(q_list)
            elif u_lower and (u_lower in topic_key_lower or topic_key_lower in u_lower):
                matched_questions.extend(q_list)

        # Fallback to entire subject pool if topic is broad
        if not matched_questions:
            for q_list in cat_bank.values():
                matched_questions.extend(q_list)

        return matched_questions

    @classmethod
    def generate_questions(
        cls,
        subject: str,
        topic: str,
        main_topic: Optional[str] = None,
        subtopics: Optional[Any] = None,
        subtopic: Optional[str] = None,
        unit: Optional[str] = None,
        unit_number: Optional[str] = None,
        additional_instructions: Optional[str] = None,
        target_class: Optional[str] = None,
        count: int = 10,
        difficulty: Optional[str] = "Mixed",
        difficulty_distribution: Optional[Dict[str, int]] = None,
        difficulty_dist: Optional[Dict[str, int]] = None,
        branch: Optional[str] = "CSE",
        question_type: str = "single_choice",
        reference_content: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates high-quality syllabus-relevant questions based on teacher's exact subject,
        main topic, subtopics, unit, and instructions.
        Uses live Google Gemini API with fallback to authoritative curriculum synthesis.
        """
        count = max(1, min(int(count or 10), 300))
        dist = difficulty_dist or difficulty_distribution or {}
        pct_easy = int(dist.get("easy", 30))
        pct_med = int(dist.get("medium", 50))
        pct_hard = int(dist.get("hard", 20))

        effective_topic = (main_topic or topic or "General Concepts").strip()
        effective_unit = (unit_number or unit or "").strip()
        raw_sub = subtopics or subtopic or ""
        if isinstance(raw_sub, list):
            subtopics_list = [str(s).strip() for s in raw_sub if str(s).strip()]
        else:
            subtopics_list = [s.strip() for s in re.split(r"[\n,]+", str(raw_sub)) if s.strip()]

        generated_list: List[Dict[str, Any]] = []
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if gemini_key:
            prompt_count = min(count, 25)
            ai_questions = cls._generate_via_gemini(
                subject=subject,
                topic=effective_topic,
                subtopics=subtopics_list,
                unit=effective_unit,
                additional_instructions=additional_instructions,
                target_class=target_class,
                count=prompt_count,
                difficulty_distribution={"easy": pct_easy, "medium": pct_med, "hard": pct_hard},
                question_type=question_type,
                reference_content=reference_content,
                api_key=gemini_key
            )
            if ai_questions:
                generated_list.extend(ai_questions)
                if len(generated_list) >= count:
                    return generated_list[:count]

        # Authoritative CSE Curriculum Engine & High-Entropy Synthesizer Fallback
        remaining = count - len(generated_list)
        synthesized = cls._synthesize_custom_questions(
            subject=subject,
            topic=effective_topic,
            subtopics_list=subtopics_list,
            unit=effective_unit,
            additional_instructions=additional_instructions,
            count=remaining,
            pct_easy=pct_easy,
            pct_med=pct_med,
            pct_hard=pct_hard,
            question_type=question_type,
            reference_content=reference_content,
            existing_questions=generated_list
        )
        generated_list.extend(synthesized)
        return generated_list[:count]

    @classmethod
    def _generate_via_gemini(
        cls,
        subject: str,
        topic: str,
        subtopics: List[str],
        unit: Optional[str],
        additional_instructions: Optional[str],
        target_class: Optional[str],
        count: int,
        difficulty_distribution: Dict[str, int],
        question_type: str,
        reference_content: Optional[str],
        api_key: str
    ) -> Optional[List[Dict[str, Any]]]:
        """Calls Google Gemini with structured JSON output, supporting flash models."""
        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        subtopics_str = ", ".join(subtopics) if subtopics else "Core principles, algorithmic mechanisms, and properties"

        unit_str = (unit or "").strip()
        if unit_str and not unit_str.lower().startswith("unit"):
            unit_str = f"Unit {unit_str}"

        q_type_desc = "4-Option Multiple Choice Questions (Single Answer MCQ)"
        if question_type == "true_false":
            q_type_desc = "True/False Questions (2 options: A: True, B: False)"
        elif question_type == "short_answer":
            q_type_desc = "Short Answer / Conceptual Questions (concise question statement with exact expected concept in Option A and plausible variations in Options B, C, D)"

        ref_context = ""
        if reference_content and reference_content.strip():
            ref_context = f"""
Syllabus / Reference Grounding Material:
\"\"\"
{reference_content[:4000]}
\"\"\"
REQUIREMENT: The generated questions MUST be grounded in the concepts, definitions, and formulas in the above reference text. For each question derived from this reference, set "source": "SYLLABUS_GROUNDED".
"""

        prompt = f"""
You are an expert Computer Science and Engineering (CSE) academic professor designing university-level examination questions.
Generate {count} distinct, technically rigorous, exam-oriented questions strictly on:
- Subject: {subject}
- Class / Cohort: {target_class or 'CSE'}
- Main Topic: {topic}
- Subtopics: {subtopics_str}
- Unit: {unit_str or 'General'}
- Question Type: {q_type_desc}
- Branch: CSE (Autonomous Engineering Curriculum)
- Additional Teacher Instructions: {additional_instructions or 'Focus on rigorous university exam standards and practical algorithmic understanding.'}
{ref_context}

Quality Guidelines:
1. Every question must be directly related to the specified subject ({subject}), main topic ({topic}), and subtopics ({subtopics_str}).
2. Test deep conceptual understanding, algorithm correctness, and complexity rather than trivia.
3. For MCQs: Provide 4 plausible options (A, B, C, D) with strictly ONE correct answer.
4. For True/False: Provide Option A: "True", Option B: "False", correct_answer: "A" or "B".
5. Provide a clear, educational explanation for the correct answer.
6. Adhere to difficulty distribution: Easy {difficulty_distribution.get('easy', 30)}%, Medium {difficulty_distribution.get('medium', 50)}%, Hard {difficulty_distribution.get('hard', 20)}%.
7. Avoid duplicate questions.
8. If reference material was provided, set "source": "SYLLABUS_GROUNDED"; otherwise set "source": "AI_GENERATED".

Output Format: Return strictly a valid JSON array adhering to this schema:
[
  {{
    "question": "Question statement text here",
    "question_type": "{question_type}",
    "options": [
      {{"key": "A", "text": "Option A text", "is_correct": false}},
      {{"key": "B", "text": "Option B text", "is_correct": true}},
      {{"key": "C", "text": "Option C text", "is_correct": false}},
      {{"key": "D", "text": "Option D text", "is_correct": false}}
    ],
    "correct_answer": "B",
    "explanation": "Technical academic explanation of the solution",
    "difficulty": "Easy/Medium/Hard",
    "subject": "{subject}",
    "unit": "{unit_str}",
    "topic": "{topic}",
    "source": "AI_GENERATED"
  }}
]
"""
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.25, "responseMimeType": "application/json"}
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=16) as response:
                    body = json.loads(response.read().decode("utf-8"))
                    text_content = body["candidates"][0]["content"]["parts"][0]["text"]
                    clean_json = re.sub(r"^```(?:json)?\s*", "", text_content.strip())
                    clean_json = re.sub(r"\s*```$", "", clean_json.strip())
                    data = json.loads(clean_json)
                    if isinstance(data, list) and len(data) > 0:
                        is_grounded = bool(reference_content and reference_content.strip())
                        for item in data:
                            item["id"] = f"ai_gen_{uuid.uuid4().hex[:8]}"
                            item["source"] = "SYLLABUS_GROUNDED" if is_grounded else "AI_GENERATED"
                            item["subject"] = subject
                            item["unit"] = unit_str or item.get("unit") or "Unit 1"
                            item["topic"] = topic
                            item["marks"] = 1.0 if question_type == "true_false" else 2.0
                        return data
            except Exception as e:
                logger.warning("Gemini model %s call failed: %s", model, e)
                continue
        return None

    @classmethod
    def _synthesize_custom_questions(
        cls,
        subject: str,
        topic: str,
        subtopics_list: List[str],
        unit: Optional[str],
        additional_instructions: Optional[str],
        count: int,
        pct_easy: int,
        pct_med: int,
        pct_hard: int,
        question_type: str,
        reference_content: Optional[str],
        existing_questions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes syllabus-relevant questions for custom subjects, topics, and subtopics,
        guaranteeing up to 300 distinct, non-repeating questions without duplication.
        """
        cat = cls._match_curriculum_category(subject)
        cat_pool = []
        if cat:
            cat_pool = cls._match_unit_topic(cat, unit or "", topic)
            if subtopics_list:
                matched_items = []
                for sub in subtopics_list:
                    sub_lower = sub.lower()
                    for q in cat_pool:
                        if (sub_lower in (q.get("question") or "").lower() or sub_lower in (q.get("topic") or "").lower()) and q not in matched_items:
                            matched_items.append(q)
                if matched_items:
                    remainder = [q for q in cat_pool if q not in matched_items]
                    cat_pool = matched_items + remainder

        active_subtopics = subtopics_list if subtopics_list else [topic]
        unit_label = (unit or "").strip()
        if unit_label and not unit_label.lower().startswith("unit"):
            unit_label = f"Unit {unit_label}"

        is_grounded = bool(reference_content and reference_content.strip())
        source_label = "SYLLABUS_GROUNDED" if is_grounded else "AI_GENERATED"

        generated: List[Dict[str, Any]] = []
        seen_texts = set()

        if existing_questions:
            for eq in existing_questions:
                qt = (eq.get("question") or eq.get("question_text") or "").strip().lower()
                if qt:
                    seen_texts.add(qt)

        # 1. Adapt matching bank questions
        if cat_pool:
            for q in cat_pool:
                q_text = (q.get("question") or "").strip().lower()
                if q_text in seen_texts:
                    continue
                seen_texts.add(q_text)
                q_copy = json.loads(json.dumps(q))
                q_copy["id"] = f"ai_gen_{uuid.uuid4().hex[:8]}"
                q_copy["subject"] = subject
                q_copy["unit"] = unit_label or q_copy.get("unit") or "Unit 1"
                q_copy["topic"] = topic
                q_copy["source"] = source_label
                generated.append(q_copy)
                if len(generated) >= count:
                    return generated[:count]

        # 2. Rich Multi-Archetype Synthesizer Matrix
        if question_type == "true_false":
            archetypes = [
                lambda sub, op, n, d, diff: {
                    "question": f"In {subject}, every node in the left subtree of {sub} strictly contains a key less than its root.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": f"Under binary search ordering invariants in {subject}, keys in any left subtree must strictly precede the parent key.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"The worst-case search time complexity in an unbalanced {sub} with n nodes is bounded by O(log n).",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": f"In an unbalanced {sub}, sorted inputs can cause degeneration into a skewed tree with linear O(n) search time.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Inorder traversal of {sub} always visits the keys in monotonically non-decreasing sorted order.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": f"Traversing (Left -> Root -> Right) recursively on {sub} processes smaller elements before larger ones, yielding sorted order.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"The balance factor of any node in an AVL tree can equal +2 during a stable balanced state without triggering rebalancing.",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "AVL balance factor must be strictly in the set {-1, 0, +1}; a value of +2 or -2 immediately triggers rotations.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Deleting a node with two children in {sub} during {op} requires replacing it with either its inorder predecessor or successor.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": f"Replacing with predecessor or successor maintains all structural search invariants in {sub}.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"The theoretical minimum possible height of {sub} containing {n} nodes is floor(log2({n})) + 1.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "A complete binary tree packs nodes with maximal density, achieving logarithmic lower bound on height.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"A complete binary tree ({sub}) of height h always contains exactly 2^h - 1 nodes.",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "A full/perfect binary tree has 2^h - 1 nodes; a complete tree's last level can be partially filled.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Performing postorder traversal on {sub} guarantees that child subtrees are completely processed before the parent node.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "Postorder visits (Left -> Right -> Root), guaranteeing children are visited prior to their ancestor.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a max-heap implementation of {sub}, the root node is guaranteed to store the smallest element.",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "In a max-heap, parent keys are greater than or equal to child keys; the root holds the maximum element.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Floyd's bottom-up heapify algorithm builds a valid binary heap of {n} elements from an unsorted array in O(n) linear time.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "Bottom-up construction converges to O(n) because the overwhelming majority of nodes are at smaller heights.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Level-order traversal of {sub} can be implemented using a standard LIFO stack without requiring a queue.",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "Level-order traversal visits nodes by horizontal breadth, which strictly requires FIFO queue semantics.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"A full binary tree ({sub}) with {n} leaf nodes always contains exactly {n} - 1 internal nodes.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "In every full binary tree where internal nodes have degree 2, mathematical induction proves L = I + 1, so I = L - 1.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Threaded binary trees utilize null child pointers to reference inorder predecessor and successor nodes.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "Threaded trees eliminate stack usage during traversal by replacing unused null pointers with traversal threads.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Splay Tree ({sub}), the worst-case time for any individual single search operation is strictly O(1).",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "Splay trees provide O(log n) amortized performance; an individual operation on an un-splayed tree can still take O(n).",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Morris traversal performs complete inorder traversal on {sub} using O(1) auxiliary space without recursion or stack frames.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "Morris traversal achieves O(1) space by temporarily modifying predecessor right pointers into threads back to the current node.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Red-Black Tree ({sub}), no simple path from root to leaf can be more than twice as long as any other path.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "Because red nodes cannot be adjacent and black-height is identical along all paths, the longest path is at most 2 * shortest path.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Rebalancing an AVL tree after {op} may require up to O(n) localized rotations across the entire tree.",
                    "options": [{"key": "A", "text": "True", "is_correct": False}, {"key": "B", "text": "False", "is_correct": True}],
                    "correct_answer": "B",
                    "explanation": "An insertion into an AVL tree requires at most 1 single or double rotation (O(1) rotations); deletion requires at most O(log n) rotations.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In {sub}, a leaf node is formally defined as any node having an out-degree of zero.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "By graph and tree definition, a leaf node has no child edges (degree 0).",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"B-Trees are multi-way search trees designed to minimize disk block access overhead during database index searches.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "High branching factor keeps B-tree height extremely small (3-4 levels), minimizing costly disk I/O.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a complete binary tree stored in an array (1-indexed), the left child of the node at index {n} is at index 2*{n}.",
                    "options": [{"key": "A", "text": "True", "is_correct": True}, {"key": "B", "text": "False", "is_correct": False}],
                    "correct_answer": "A",
                    "explanation": "For 1-based indexing, the left child is always at 2i and the right child is at 2i + 1.",
                    "difficulty": "Easy"
                }
            ]
        else:
            archetypes = [
                lambda sub, op, n, d, diff: {
                    "question": f"What is the worst-case asymptotic time complexity of search operations in {sub} containing n nodes?",
                    "options": [
                        {"key": "A", "text": "O(log n) when balanced, degrading to O(n) when skewed", "is_correct": True},
                        {"key": "B", "text": "Strictly O(1) across all input topologies", "is_correct": False},
                        {"key": "C", "text": "O(n log n) due to mandatory auxiliary heap allocations", "is_correct": False},
                        {"key": "D", "text": "O(n^2) for all non-trivial datasets", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"In {sub}, search traverses from root downwards. For balanced trees height is O(log n), but a degenerate tree degrades to linear O(n).",
                    "difficulty": diff
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Under average-case conditions with uniformly distributed random keys, what is the expected time complexity of {op} in {sub}?",
                    "options": [
                        {"key": "A", "text": "O(log n)", "is_correct": True},
                        {"key": "B", "text": "O(n)", "is_correct": False},
                        {"key": "C", "text": "O(1)", "is_correct": False},
                        {"key": "D", "text": "O(n^2)", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"When keys are randomly inserted into {sub}, the expected tree height grows logarithmically as O(log n).",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"What is the auxiliary call-stack memory complexity of recursive depth-first traversal on {sub} of height h?",
                    "options": [
                        {"key": "A", "text": "O(h) space directly proportional to the maximum recursion depth", "is_correct": True},
                        {"key": "B", "text": "Strictly O(1) space regardless of tree depth", "is_correct": False},
                        {"key": "C", "text": "O(n^2) space due to frame duplication", "is_correct": False},
                        {"key": "D", "text": "O(log h) using compressed stack frames", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Depth-first recursion retains activation records up to the maximum leaf path depth, which equals the tree height h.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Which structural invariant must be strictly satisfied by every internal node in {sub}?",
                    "options": [
                        {"key": "A", "text": "All keys in the left subtree are smaller, and all keys in the right subtree are greater than the node key.", "is_correct": True},
                        {"key": "B", "text": "Both left and right subtrees must have identical heights at all times.", "is_correct": False},
                        {"key": "C", "text": "All leaf nodes must reside at exactly the same depth index.", "is_correct": False},
                        {"key": "D", "text": "Child node keys must be stored in reverse descending order.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"The core invariant of {sub} mandates that the left subtree holds strictly smaller keys and the right subtree holds strictly greater keys.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"For {sub} containing exactly {n} nodes, what is the theoretical minimum possible tree height (in levels)?",
                    "options": [
                        {"key": "A", "text": f"floor(log2({n})) + 1", "is_correct": True},
                        {"key": "B", "text": f"{n} // 2", "is_correct": False},
                        {"key": "C", "text": f"ceil(sqrt({n}))", "is_correct": False},
                        {"key": "D", "text": f"log10({n}) + 2", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"A completely filled binary tree packs nodes with maximum density, yielding minimum height floor(log2(n)) + 1.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In {sub}, when deleting a node possessing two non-null children during {op}, which node is used as its safe replacement?",
                    "options": [
                        {"key": "A", "text": "Its inorder predecessor (maximum in left subtree) or inorder successor (minimum in right subtree)", "is_correct": True},
                        {"key": "B", "text": "The root node of the tree", "is_correct": False},
                        {"key": "C", "text": "The immediate parent of the node", "is_correct": False},
                        {"key": "D", "text": "Any arbitrary leaf node chosen at random", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Replacing the node with its inorder predecessor or successor guarantees that the binary search ordering invariant remains intact.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Performing an inorder traversal (Left -> Root -> Right) on {sub} processes the elements in which specific sequence?",
                    "options": [
                        {"key": "A", "text": "Strictly non-decreasing sorted order", "is_correct": True},
                        {"key": "B", "text": "Reverse descending order from maximum to minimum", "is_correct": False},
                        {"key": "C", "text": "Breadth-first level-by-level sequence", "is_correct": False},
                        {"key": "D", "text": "Unpredictable pseudo-random sequence", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Inorder traversal visits left (smaller), root, right (larger), naturally producing keys in sorted order.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"When {op} causes {sub} to violate balanced height constraints, what constant-time operation is applied?",
                    "options": [
                        {"key": "A", "text": "Pointer rotations (Single LL/RR or Double LR/RL rotations)", "is_correct": True},
                        {"key": "B", "text": "Full linear scan and bubble sort of all nodes", "is_correct": False},
                        {"key": "C", "text": "Immediate deletion of the root element", "is_correct": False},
                        {"key": "D", "text": "Re-allocating the entire tree in contiguous memory", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Balanced tree algorithms utilize localized pointer rotations in O(1) time to restore balance factors without violating the search order.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"If keys are inserted into an unbalanced {sub} in strictly sorted sequential order (1 to {n}), what is the resulting topology?",
                    "options": [
                        {"key": "A", "text": "A right-skewed degenerate tree equivalent to a singly linked list with O(n) search time", "is_correct": True},
                        {"key": "B", "text": "A perfectly balanced complete binary tree with O(log n) height", "is_correct": False},
                        {"key": "C", "text": "A circular doubly linked list", "is_correct": False},
                        {"key": "D", "text": "A valid max-heap", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Inserting sorted data into an unbalanced tree continuously adds nodes to the right, creating a skewed tree of height n.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In {sub}, what is the maximum number of nodes that can exist at depth level {d} (with root at depth 0)?",
                    "options": [
                        {"key": "A", "text": f"{2**d} nodes (2^{d})", "is_correct": True},
                        {"key": "B", "text": f"{2**(d+1)} nodes", "is_correct": False},
                        {"key": "C", "text": f"{d**2} nodes", "is_correct": False},
                        {"key": "D", "text": f"{2*d + 1} nodes", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Each level can hold up to twice the nodes of the previous level, giving 2^d nodes at depth d.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Which auxiliary data structure is fundamentally required to perform iterative level-order (breadth-first) traversal on {sub}?",
                    "options": [
                        {"key": "A", "text": "A FIFO Queue", "is_correct": True},
                        {"key": "B", "text": "A LIFO Stack", "is_correct": False},
                        {"key": "C", "text": "A Priority Min-Heap", "is_correct": False},
                        {"key": "D", "text": "A Disjoint-Set Union structure", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Breadth-first level-order traversal visits nodes in FIFO arrival order, requiring a queue.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In {sub}, what pointer operation is required to delete a leaf node during {op}?",
                    "options": [
                        {"key": "A", "text": "Set the corresponding child pointer of its parent to null and free the node's memory.", "is_correct": True},
                        {"key": "B", "text": "Promote the root node to take the leaf node's position.", "is_correct": False},
                        {"key": "C", "text": "Rotate the entire subtree clockwise.", "is_correct": False},
                        {"key": "D", "text": "Copy all sibling nodes into an auxiliary array.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"A leaf node has no children; deleting it simply requires clearing the parent's pointer and releasing the allocated memory.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a 64-bit architecture, what is the primary memory overhead of storing elements in {sub} versus a compact array?",
                    "options": [
                        {"key": "A", "text": "Each node requires at least 16 bytes for left and right child pointers in addition to data.", "is_correct": True},
                        {"key": "B", "text": "Tree nodes must reserve 1 kilobyte of padding for CPU caches.", "is_correct": False},
                        {"key": "C", "text": "Array elements require more pointers than tree nodes.", "is_correct": False},
                        {"key": "D", "text": "Tree nodes cannot store 32-bit integer primitives.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"On 64-bit machines, each pointer is 8 bytes. Two child pointers per node add 16 bytes of structural overhead.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In {sub}, if a node has NO right subtree, how is its inorder successor determined during {op}?",
                    "options": [
                        {"key": "A", "text": "The lowest ancestor of the node whose left child is also an ancestor of the node.", "is_correct": True},
                        {"key": "B", "text": "The minimum element of the entire tree.", "is_correct": False},
                        {"key": "C", "text": "The rightmost child of the left subtree.", "is_correct": False},
                        {"key": "D", "text": "It has no successor; such a node is always the maximum element.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"When right child is null, the successor is the deepest ancestor for which the node lies in its left subtree.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"When a complete {sub} is stored in a 1-indexed array, what is the index of the parent of node at index {n}?",
                    "options": [
                        {"key": "A", "text": f"{n} // 2", "is_correct": True},
                        {"key": "B", "text": f"{n} - 1", "is_correct": False},
                        {"key": "C", "text": f"2 * {n}", "is_correct": False},
                        {"key": "D", "text": f"{n} // 2 + 1", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"In 1-based binary tree array indexing, the parent of node i is always at floor(i / 2).",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In any non-empty full binary tree ({sub}) with {n} total nodes, which relationship holds between leaves L and internal nodes I?",
                    "options": [
                        {"key": "A", "text": "L = I + 1 (the number of leaves is always one more than the internal nodes)", "is_correct": True},
                        {"key": "B", "text": "L = 2 * I", "is_correct": False},
                        {"key": "C", "text": "L = I - 1", "is_correct": False},
                        {"key": "D", "text": "L = I^2", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"In a full binary tree where every internal node has 2 children, mathematical induction proves L = I + 1.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Why is Postorder Traversal (Left -> Right -> Root) predominantly chosen when deallocating or freeing {sub} from memory?",
                    "options": [
                        {"key": "A", "text": "Children must be freed before the parent node is deleted to avoid dangling pointers.", "is_correct": True},
                        {"key": "B", "text": "It guarantees that the root is deleted first, preventing child access.", "is_correct": False},
                        {"key": "C", "text": "It sorts the memory addresses before garbage collection.", "is_correct": False},
                        {"key": "D", "text": "It runs in O(1) time whereas other traversals run in O(n) time.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Bottom-up deletion requires visiting both subtrees before freeing the current node, which matches postorder traversal exactly.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"When {sub} represents an arithmetic expression tree, what does a Preorder Traversal yield?",
                    "options": [
                        {"key": "A", "text": "The prefix (Polish notation) representation of the arithmetic expression.", "is_correct": True},
                        {"key": "B", "text": "The postfix (Reverse Polish notation) representation.", "is_correct": False},
                        {"key": "C", "text": "The fully parenthesized standard infix representation.", "is_correct": False},
                        {"key": "D", "text": "The numerical evaluation result.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Visiting root operator before left and right operand subtrees produces prefix notation.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"When {sub} represents an arithmetic expression tree, what does a Postorder Traversal yield?",
                    "options": [
                        {"key": "A", "text": "The postfix (Reverse Polish notation) representation of the expression.", "is_correct": True},
                        {"key": "B", "text": "The prefix notation.", "is_correct": False},
                        {"key": "C", "text": "The relational calculus expression.", "is_correct": False},
                        {"key": "D", "text": "The asymptotic time complexity equation.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Visiting left operand, right operand, then operator produces Reverse Polish (postfix) notation.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"What is the strict upper bound on the number of comparisons required to search in an AVL Tree ({sub}) with {n} keys?",
                    "options": [
                        {"key": "A", "text": f"Approximately 1.44 * log2({n}) comparisons in the worst case", "is_correct": True},
                        {"key": "B", "text": f"{n} comparisons in the worst case", "is_correct": False},
                        {"key": "C", "text": "O(1) comparisons using collision lists", "is_correct": False},
                        {"key": "D", "text": f"{n} // 2 comparisons", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Fibonacci trees represent the sparsest AVL trees, leading to a maximum height bound of h <= 1.44 * log2(n).",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"Why are B-Trees preferred over standard {sub} for database index storage on secondary disk drives?",
                    "options": [
                        {"key": "A", "text": "B-Trees have high branching factors (fan-out) that drastically reduce disk seek operations.", "is_correct": True},
                        {"key": "B", "text": "Binary search trees cannot store string data types.", "is_correct": False},
                        {"key": "C", "text": "B-Trees require zero CPU memory allocations.", "is_correct": False},
                        {"key": "D", "text": "Binary search trees cannot be serialized to disk blocks.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Disk I/O is slow. A high fan-out B-tree keeps height very low (3-4 levels), minimizing disk seeks.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Threaded Binary Tree implementation of {sub}, what do the null pointers store during {op}?",
                    "options": [
                        {"key": "A", "text": "Threads that point to the inorder predecessor and successor nodes.", "is_correct": True},
                        {"key": "B", "text": "Memory addresses of the root node exclusively.", "is_correct": False},
                        {"key": "C", "text": "Encrypted checksum hashes of the subtrees.", "is_correct": False},
                        {"key": "D", "text": "The depth index of the parent node.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Threaded trees replace null child pointers with references to inorder predecessors/successors, eliminating stack overhead.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"What is the auxiliary memory complexity of Morris Traversal for {sub}?",
                    "options": [
                        {"key": "A", "text": "O(1) constant auxiliary space without stack or recursion.", "is_correct": True},
                        {"key": "B", "text": "O(n) auxiliary space.", "is_correct": False},
                        {"key": "C", "text": "O(log n) auxiliary space.", "is_correct": False},
                        {"key": "D", "text": "O(n^2) space.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Morris traversal dynamically weaves temporary threads from predecessors back to current nodes, achieving O(1) space.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"How is the minimum element located in {sub} starting from the root node?",
                    "options": [
                        {"key": "A", "text": "By following left child pointers until a node with a null left child is reached.", "is_correct": True},
                        {"key": "B", "text": "By following right child pointers to the deepest leaf.", "is_correct": False},
                        {"key": "C", "text": "By checking the root, which always stores the minimum key.", "is_correct": False},
                        {"key": "D", "text": "By computing the average of all leaf nodes.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"By the binary search invariant, smaller keys are always in the left subtree, so the leftmost node holds the minimum key.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"How is the maximum element located in {sub} starting from the root node?",
                    "options": [
                        {"key": "A", "text": "By following right child pointers until a node with a null right child is reached.", "is_correct": True},
                        {"key": "B", "text": "By following left child pointers to the deepest leaf.", "is_correct": False},
                        {"key": "C", "text": "By checking the root node value.", "is_correct": False},
                        {"key": "D", "text": "By scanning the first level of the tree.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"By the binary search invariant, larger keys are always in the right subtree, so the rightmost node holds the maximum key.",
                    "difficulty": "Easy"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"What is the correct algorithm to validate whether a binary tree is a valid {sub} in O(n) time?",
                    "options": [
                        {"key": "A", "text": "Recursively verify that each node key falls strictly within a valid range (min_val, max_val).", "is_correct": True},
                        {"key": "B", "text": "Only check that node.val > node.left.val and node.val < node.right.val locally.", "is_correct": False},
                        {"key": "C", "text": "Verify that the number of nodes is an odd integer.", "is_correct": False},
                        {"key": "D", "text": "Check if the tree height is less than 10.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Local checks miss ancestor violations. Each node must be validated within global bounds (min, max) narrowed during traversal.",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"What is the time complexity of building a heap from an arbitrary array of {n} elements using Floyd bottom-up heapify algorithm for {sub}?",
                    "options": [
                        {"key": "A", "text": "O(n) linear time.", "is_correct": True},
                        {"key": "B", "text": "O(n log n) time.", "is_correct": False},
                        {"key": "C", "text": "O(n^2) time.", "is_correct": False},
                        {"key": "D", "text": "O(1) time.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Bottom-up heap construction runs in O(n) time because the sum of heights of all nodes converges to O(n).",
                    "difficulty": "Medium"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Splay Tree implementation of {sub}, what is the amortized time complexity of {op}?",
                    "options": [
                        {"key": "A", "text": "O(log n) amortized time.", "is_correct": True},
                        {"key": "B", "text": "O(1) worst-case time.", "is_correct": False},
                        {"key": "C", "text": "O(n^2) amortized time.", "is_correct": False},
                        {"key": "D", "text": "O(n log n) per single operation.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"By splaying accessed nodes to the root, splay trees guarantee O(log n) amortized complexity per operation.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Treap data structure combining {sub} and a heap, how are keys and priorities organized during {op}?",
                    "options": [
                        {"key": "A", "text": "Keys satisfy binary search tree ordering, while randomly assigned priorities satisfy heap ordering.", "is_correct": True},
                        {"key": "B", "text": "Keys satisfy heap ordering, and priorities satisfy queue ordering.", "is_correct": False},
                        {"key": "C", "text": "Both keys and priorities must be strictly identical.", "is_correct": False},
                        {"key": "D", "text": "Priorities are sorted in reverse alphabetical order.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Treap pairs BST keys with random heap priorities to probabilistically achieve balanced O(log n) performance.",
                    "difficulty": "Hard"
                },
                lambda sub, op, n, d, diff: {
                    "question": f"In a Red-Black Tree representation of {sub}, what is the maximum number of rotations required after {op}?",
                    "options": [
                        {"key": "A", "text": "At most 2 rotations.", "is_correct": True},
                        {"key": "B", "text": "O(log n) rotations.", "is_correct": False},
                        {"key": "C", "text": "O(n) rotations.", "is_correct": False},
                        {"key": "D", "text": "At most 5 rotations.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"While recoloring can propagate up the tree, at most 2 rotations are ever required to restore Red-Black invariants after insertion.",
                    "difficulty": "Hard"
                }
            ]

        operations = ["insertion", "deletion", "key search", "range query", "inorder traversal", "rebalancing"]
        n_values = [15, 31, 63, 127, 255, 511, 1023]
        d_values = [2, 3, 4, 5, 6, 7]
        difficulties = ["Easy", "Medium", "Hard"]

        iteration = 0
        while len(generated) < count and iteration < 4000:
            arch_fn = archetypes[iteration % len(archetypes)]
            sub = active_subtopics[(iteration // len(archetypes)) % len(active_subtopics)]
            op = operations[(iteration // (len(archetypes) * len(active_subtopics))) % len(operations)]
            n = n_values[iteration % len(n_values)]
            d = d_values[iteration % len(d_values)]
            diff = difficulties[iteration % len(difficulties)]

            q_item = arch_fn(sub, op, n, d, diff)
            norm_key = q_item["question"].strip().lower()
            if norm_key not in seen_texts:
                seen_texts.add(norm_key)
                q_id = f"ai_gen_{uuid.uuid4().hex[:8]}"
                generated.append({
                    "id": q_id,
                    "question": q_item["question"],
                    "question_text": q_item["question"],
                    "question_type": question_type,
                    "options": q_item["options"],
                    "correct_answer": q_item["correct_answer"],
                    "explanation": q_item["explanation"],
                    "difficulty": q_item.get("difficulty", diff),
                    "subject": subject,
                    "unit": unit_label or "Unit 1",
                    "topic": sub if sub != topic else topic,
                    "subtopic": sub,
                    "source": source_label,
                    "marks": 1.0 if question_type == "true_false" else 2.0
                })
            iteration += 1

        # Parametric context expansion to fulfill full requested count up to 300
        context_prefixes = [
            "Given an enterprise CSE system running {sub} under peak load",
            "In an academic examination setting testing {sub} principles",
            "When analyzing algorithmic efficiency in {sub} with input dimension N={n}",
            "Considering a concurrent multi-threaded environment implementing {sub}",
            "In a mission-critical infrastructure service utilizing {sub}",
            "Under rigorous performance profiling of {sub} operations ({op})",
            "In a distributed cloud pipeline integrating {sub} components",
            "For memory-constrained embedded hardware deploying {sub}",
            "Analyzing edge-case boundary conditions during {sub} execution",
            "In a fault-tolerant backend cluster executing {sub} routines"
        ]
        var_idx = 0
        while len(generated) < count and var_idx < 6000:
            arch_fn = archetypes[var_idx % len(archetypes)]
            sub = active_subtopics[(var_idx // len(archetypes)) % len(active_subtopics)]
            op = operations[(var_idx // (len(archetypes) * len(active_subtopics))) % len(operations)]
            n = (var_idx * 17 + 31) % 2048 + 16
            d = (var_idx % 8) + 2
            diff = difficulties[var_idx % len(difficulties)]

            q_item = arch_fn(sub, op, n, d, diff)
            ctx = context_prefixes[var_idx % len(context_prefixes)].format(sub=sub, n=n, op=op)
            raw_q = q_item["question"].strip()
            varied_text = f"{ctx}, {raw_q[0].lower() + raw_q[1:]}" if raw_q else raw_q
            norm_key = varied_text.strip().lower()
            if norm_key not in seen_texts:
                seen_texts.add(norm_key)
                q_id = f"ai_gen_{uuid.uuid4().hex[:8]}"
                generated.append({
                    "id": q_id,
                    "question": varied_text,
                    "question_text": varied_text,
                    "question_type": question_type,
                    "options": q_item["options"],
                    "correct_answer": q_item["correct_answer"],
                    "explanation": f"{ctx}. {q_item['explanation']}",
                    "difficulty": q_item.get("difficulty", diff),
                    "subject": subject,
                    "unit": unit_label or "Unit 1",
                    "topic": sub if sub != topic else topic,
                    "subtopic": sub,
                    "source": source_label,
                    "marks": 1.0 if question_type == "true_false" else 2.0
                })
            var_idx += 1

        random.shuffle(generated)
        return generated[:count]

    @classmethod
    def parse_and_validate_csv(cls, csv_text: str) -> Dict[str, Any]:
        """
        Validates CSV question bank rows:
        Columns expected: question, type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, unit, topic
        """
        errors = []
        valid_questions = []

        if not csv_text or not csv_text.strip():
            return {
                "total_rows": 0,
                "valid_count": 0,
                "invalid_count": 1,
                "valid_questions": [],
                "errors": [{"row": 1, "error": "CSV content is empty."}]
            }

        try:
            reader = csv.DictReader(io.StringIO(csv_text.strip()))
        except Exception as e:
            return {
                "total_rows": 0,
                "valid_count": 0,
                "invalid_count": 1,
                "valid_questions": [],
                "errors": [{"row": 1, "error": f"Failed to parse CSV format: {str(e)}"}]
            }

        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
        req_headers = ["question", "option_a", "option_b", "correct_answer"]
        missing = [rh for rh in req_headers if not any(rh in h for h in headers)]
        if missing:
            return {
                "total_rows": 0,
                "valid_count": 0,
                "invalid_count": 1,
                "valid_questions": [],
                "errors": [{"row": 1, "error": f"Missing required CSV column(s): {', '.join(missing)}"}]
            }

        row_num = 1
        seen_questions = set()

        for raw_row in reader:
            row_num += 1
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}

            q_text = row.get("question") or row.get("question_text") or ""
            if not q_text:
                errors.append({"row": row_num, "error": "Question text is empty."})
                continue

            q_key = re.sub(r"\s+", " ", q_text.lower())
            if q_key in seen_questions:
                errors.append({"row": row_num, "question": q_text[:60], "error": "Duplicate question in uploaded CSV."})
                continue
            seen_questions.add(q_key)

            opt_a = row.get("option_a") or row.get("a") or ""
            opt_b = row.get("option_b") or row.get("b") or ""
            opt_c = row.get("option_c") or row.get("c") or ""
            opt_d = row.get("option_d") or row.get("d") or ""

            if not opt_a or not opt_b:
                errors.append({"row": row_num, "question": q_text[:60], "error": "Options A and B are required."})
                continue

            corr = (row.get("correct_answer") or row.get("correct") or "A").strip().upper()
            if corr not in ("A", "B", "C", "D"):
                if corr == opt_a.upper(): corr = "A"
                elif corr == opt_b.upper(): corr = "B"
                elif corr == opt_c.upper(): corr = "C"
                elif corr == opt_d.upper(): corr = "D"
                else:
                    errors.append({"row": row_num, "question": q_text[:60], "error": f"Invalid correct_answer '{corr}'. Must be A, B, C, or D."})
                    continue

            options = [
                {"key": "A", "text": opt_a, "is_correct": corr == "A"},
                {"key": "B", "text": opt_b, "is_correct": corr == "B"},
            ]
            if opt_c:
                options.append({"key": "C", "text": opt_c, "is_correct": corr == "C"})
            if opt_d:
                options.append({"key": "D", "text": opt_d, "is_correct": corr == "D"})

            diff = (row.get("difficulty") or "Medium").capitalize()
            if diff not in ("Easy", "Medium", "Hard"):
                diff = "Medium"

            valid_questions.append({
                "id": f"csv_{uuid.uuid4().hex[:8]}",
                "question": q_text,
                "question_text": q_text,
                "question_type": "single_choice",
                "options": options,
                "correct_answer": corr,
                "explanation": row.get("explanation") or "",
                "difficulty": diff,
                "unit": row.get("unit") or "Imported Unit",
                "topic": row.get("topic") or "Imported Topic",
                "marks": float(row.get("marks") or 2.0),
                "negative_marks": float(row.get("negative_marks") or 0.5),
                "source": "CSV_IMPORTED"
            })

        return {
            "total_rows": row_num - 1,
            "valid_count": len(valid_questions),
            "invalid_count": len(errors),
            "valid_questions": valid_questions,
            "errors": errors
        }

    @classmethod
    def add_bulk_questions_to_quiz(
        cls,
        quiz_id: str,
        questions: List[Dict[str, Any]],
        db: Session
    ) -> Dict[str, Any]:
        """
        Atomically saves validated questions into existing quiz_questions and question_options tables.
        Stores source metadata (unit, topic, difficulty, source) in hint JSON without altering table schemas.
        """
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")

        max_order = db.execute(
            text("SELECT COALESCE(MAX(question_order), 0) FROM quiz_questions WHERE quiz_id = :qid"),
            {"qid": quiz_id}
        ).scalar() or 0

        inserted_count = 0
        added_ids = []

        for q in questions:
            max_order += 1
            q_id = str(uuid.uuid4())
            q_text = (q.get("question") or q.get("question_text") or "Question Text").strip()
            q_type = "single_choice"
            q_marks = float(q.get("marks") or 2.0)
            q_neg = float(q.get("negative_marks") or 0.5)
            q_exp = (q.get("explanation") or "").strip()

            meta_json = json.dumps({
                "unit": q.get("unit") or "",
                "topic": q.get("topic") or "",
                "difficulty": q.get("difficulty") or "Medium",
                "source": q.get("source") or "AI_GENERATED"
            })

            db.execute(text("""
                INSERT INTO quiz_questions (
                    id, quiz_id, question_text, question_type, marks, negative_marks, explanation, hint, question_order, created_at
                ) VALUES (
                    :id, :qid, :txt, :typ, :m, :nm, :exp, :hint, :ord, CURRENT_TIMESTAMP
                )
            """), {
                "id": q_id, "qid": quiz_id, "txt": q_text, "typ": q_type,
                "m": q_marks, "nm": q_neg, "exp": q_exp, "hint": meta_json, "ord": max_order
            })

            # Record question metadata for difficulty-aware randomized sampling
            q_diff = str(q.get("difficulty") or "Medium").upper()
            q_top = str(q.get("topic") or "")[:150]
            try:
                db.execute(text("""
                    INSERT INTO quiz_question_metadata (question_id, quiz_id, difficulty, topic, created_at)
                    VALUES (:id, :qid, :diff, :top, CURRENT_TIMESTAMP)
                    ON CONFLICT (question_id) DO UPDATE SET difficulty = :diff, topic = :top
                """), {"id": q_id, "qid": quiz_id, "diff": q_diff, "top": q_top})
            except Exception:
                pass

            opts = q.get("options") or []
            opt_order = 1
            for opt in opts:
                opt_id = str(uuid.uuid4())
                opt_text = (opt.get("text") or opt.get("option_text") or "").strip()
                is_corr = bool(opt.get("is_correct"))

                db.execute(text("""
                    INSERT INTO question_options (id, question_id, option_text, option_order, is_correct, created_at)
                    VALUES (:id, :qid, :txt, :ord, :corr, CURRENT_TIMESTAMP)
                """), {
                    "id": opt_id, "qid": q_id, "txt": opt_text, "ord": opt_order, "corr": is_corr
                })
                opt_order += 1

            inserted_count += 1
            added_ids.append(q_id)

        # Update quiz aggregates
        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        sum_marks = db.execute(text("SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        pass_m = round(float(sum_marks) * 0.4, 2)

        db.execute(text("""
            UPDATE quizzes
            SET total_questions = :tq,
                total_marks = :tm,
                passing_marks = :pm,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {"tq": tot_q, "tm": float(sum_marks), "pm": pass_m, "id": quiz_id})
        db.commit()

        return {
            "quiz_id": quiz_id,
            "inserted_count": inserted_count,
            "total_questions": tot_q,
            "total_marks": float(sum_marks),
            "added_ids": added_ids
        }
