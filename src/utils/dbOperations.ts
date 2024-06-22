import { Node, Edge, GraphData } from './xmlParser';

const DB_NAME = 'GraphDatabase';
const DB_VERSION = 1;
const STORE_NAMES = {
    NODES: 'nodes',
    EDGES: 'edges'
};

export async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.createObjectStore(STORE_NAMES.NODES, { keyPath: 'id' });
            db.createObjectStore(STORE_NAMES.EDGES, { keyPath: 'id', autoIncrement: true });
        };
    });
}

export async function getGraphDataFromDB(): Promise<GraphData> {
    const db = await openDB();

    try {
        const nodes = await getAllFromStore<Node>(db, STORE_NAMES.NODES);
        const edges = await getAllFromStore<Edge>(db, STORE_NAMES.EDGES);

        const nodesObject: { [key: string]: Node } = {};
        nodes.forEach(node => {
            nodesObject[node.id] = node;
        });

        return {
            nodes: nodesObject,
            edges: edges
        };
    } finally {
        db.close();
    }
}

async function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function addNodeToDB(node: Node): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAMES.NODES, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.NODES);
    await new Promise<void>((resolve, reject) => {
        const request = store.put(node);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
    db.close();
}

export async function addEdgeToDB(edge: Edge): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAMES.EDGES, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.EDGES);
    await new Promise<void>((resolve, reject) => {
        const request = store.put(edge);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
    db.close();
}

export async function removeNodeFromDB(nodeId: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAMES.NODES, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.NODES);
    await new Promise<void>((resolve, reject) => {
        const request = store.delete(nodeId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
    db.close();
}

export async function removeEdgeFromDB(edgeId: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAMES.EDGES, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.EDGES);
    await new Promise<void>((resolve, reject) => {
        const request = store.delete(edgeId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
    db.close();
}

// Add a function to clear the database before adding new data
export async function clearDatabase(): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAMES.NODES, STORE_NAMES.EDGES], 'readwrite');
    const nodesStore = transaction.objectStore(STORE_NAMES.NODES);
    const edgesStore = transaction.objectStore(STORE_NAMES.EDGES);

    await Promise.all([
        new Promise<void>((resolve, reject) => {
            const request = nodesStore.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        }),
        new Promise<void>((resolve, reject) => {
            const request = edgesStore.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        })
    ]);

    db.close();
}
