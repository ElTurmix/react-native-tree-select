import React, { Component } from "react";
import { StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, ScrollView, SafeAreaView,} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchBar } from "react-native-elements";
import { breadthFirstRecursion } from '../utils/menutransform';
import { ScreenHeight } from "react-native-elements/dist/helpers/index.js";


let selectedNodes=[];

export default class TreeSelect extends Component {
  constructor(props) {
    super(props);
    this.routes = [];
    selectedNodes=[];
    this.state = {
      nodesStatus: this._initNodesStatus(),
      currentNode: this._initCurrentNode(),
      filterText: '',
      renderKey:1,
      filteredNodes: [],
      ruta:''
    };
  }
  
  _initCurrentNode = () => {
    const { defaultSelectedId, selectType } = this.props;
    if (selectType === 'multiple') {
      return defaultSelectedId || [];
    }
    return defaultSelectedId && defaultSelectedId[0] || null;
  };

  _initNodesStatus = () => {
    const { isOpen = false, data, openIds = [], defaultSelectedId = [] } = this.props;
    const { idEstructuraJerarquica} = this.props;
    const nodesStatus = new Map();
    if (!isOpen) {
      if (openIds && openIds.length) {
        for (let id of openIds) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(parent.id, true));
        }
      }
      // 设置默认选中时父节点的展开操作
      if (defaultSelectedId && defaultSelectedId.length) {
        for (let id of defaultSelectedId) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(parent.id, true));
        }
      }
      return nodesStatus;
    }
    breadthFirstRecursion(data).map(item => nodesStatus.set(item.id, true));
    return nodesStatus;
  };

  _find = (data, id) => {
    const stack = [];
    let going = true;

    const walker = (childrenData, innerId) => {
      childrenData.forEach(item => {
        if (!going) return;
        stack.push({
          id: item.id,
          name: item.name,
          parentId: item.parentId,
          children: item.children
        });
        if (item['id'] === innerId) {
          going = false;
        } else if (item['children']) {
          walker(item['children'], innerId);
        } else {
          stack.pop();
        }
      });
      if (going) stack.pop();
    };

    walker(data, id);
    return stack;
  };

  _onPressCollapse = ({ e, item }) => { // eslint-disable-line
    const { data, selectType, leafCanBeSelected } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, item.id);
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      nodesStatus.set(item && item.id, !nodesStatus.get(item && item.id)); // toggle
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(item.id) ?
          currentNode.filter(nodeid => nodeid !== item.id) : currentNode.concat(item.id)
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: tempCurrentNode, nodesStatus };
      } else {
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: item.id, nodesStatus };
      }
    }, () => {
      /*const { onClick } = this.props;
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });*/
    });
  };

  _onClick = ({ e, item }) => { // eslint-disable-line
    const { data } = this.props;
    const routes = this._find(data, item.id);
    var txt = "";
    if (routes)
      for (var i = 0; i < routes.length; i++) {
        if (txt.length > 0) txt += " / ";
        txt += routes[i].name;
      }
      this.setState({ ruta: txt });
  }

  _onClickLeaf = ({ e, item }) => { // eslint-disable-line
    const { onClickLeaf, onClick, selectType, leafCanBeSelected } = this.props;
    const { data } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, item.id);
    this.setState((state) => {
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(item.id) ?
          currentNode.filter(nodeid => nodeid !== item.id) : currentNode.concat(item.id)
        return {
          currentNode: tempCurrentNode,
        };
      } else {
        return {
          currentNode: item.id
        };
      }
    }, () => {/*
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });
      onClickLeaf && onClickLeaf({ item, routes, currentNode: this.state.currentNode });*/
    });
  };

  _renderTreeNodeIcon = (isOpen) => {
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle } = this.props;
    const collapseIcon = isOpen ? {
      borderRightWidth: 5,
      borderRightColor: 'transparent',
      borderLeftWidth: 5,
      borderLeftColor: 'transparent',
      borderTopWidth: 10,
      borderTopColor: 'black',
    } : {
      borderBottomWidth: 5,
      borderBottomColor: 'transparent',
      borderTopWidth: 5,
      borderTopColor: 'transparent',
      borderLeftWidth: 10,
      borderLeftColor: 'black',
    };
    const openIcon = treeNodeStyle && treeNodeStyle.openIcon;
    const closeIcon = treeNodeStyle && treeNodeStyle.closeIcon;

    return openIcon && closeIcon ? <View>{isOpen ? openIcon : closeIcon}</View> :
      <View style={[styles.collapseIcon, collapseIcon]} />;
  };

  _renderRow = ({ item }) => {
    const { currentNode } = this.state;
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle, selectType = 'single', leafCanBeSelected } = this.props;
    const { backgroundColor, fontSize, color } = itemStyle && itemStyle;
    const openIcon = treeNodeStyle && treeNodeStyle.openIcon;
    const closeIcon = treeNodeStyle && treeNodeStyle.closeIcon;

    const selectedBackgroundColor = selectedItemStyle && selectedItemStyle.backgroundColor;
    const selectedFontSize = selectedItemStyle && selectedItemStyle.fontSize;
    const selectedColor = selectedItemStyle && selectedItemStyle.color;
    const isCurrentNode = selectType === 'multiple' ? currentNode.includes(item.id) : (currentNode === item.id);
    const isResultadoBusqueda = selectedNodes.includes(item.id);

    if (item && item.children && item.children.length) {
      const isOpen = this.state.nodesStatus && this.state.nodesStatus.get(item && item.id) || false;
      return (
        <View>
          <TouchableOpacity onPress={(e) => {this._onClick({ e, item });this._onPressCollapse({ e, item });}} >
            <View style={{
              flexDirection: 'row',
              backgroundColor: !leafCanBeSelected && isCurrentNode ? selectedBackgroundColor || '#FFEDCE' : (isResultadoBusqueda? backgroundColor || '#8fbc8f' : backgroundColor || 'transparent'),
              marginBottom: 2,
              height: 30,
              alignItems: 'center'
            }}
            >
              { this._renderTreeNodeIcon(isOpen) }
              {
                isShowTreeId && <Text style={{ fontSize: 14, marginLeft: 4 }}>{item.id}</Text>
              }
              <Text style={[styles.textName, !leafCanBeSelected && isCurrentNode ?
                { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}>{item.name}</Text>
            </View>
          </TouchableOpacity>
          {
            !isOpen ? null :
            <FlatList
              keyExtractor={(childrenItem, i) => i.toString()}
              style={{ flex: 1, marginLeft: 15 }}
              onEndReachedThreshold={0.01}
              {...this.props}
              data={item.children}
              extraData={this.state}
              renderItem={this._renderRow}
            />
          }
        </View>
      );
    }
    return (
      <TouchableOpacity onPress={(e) => {this._onClick({ e, item });this._onClickLeaf({ e, item });}}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isCurrentNode ? selectedBackgroundColor || '#FFEDCE' : (isResultadoBusqueda? backgroundColor || '#8fbc8f' : backgroundColor || 'transparent'),
          marginBottom: 2,
          height: 30,
          alignItems: 'center'
        }}
        >
          <Text
            style={[styles.textName, isCurrentNode ?
              { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}
          >{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  /***************************************
    Búsqueda por idEstructuraJerárquica
  ***************************************/
  seleccionarIdEstructuraJerarquica=async ()=>{
    var items=this.props.data;
    var idEstructuraJerarquica=this.props.idEstructuraJerarquica;
    if(idEstructuraJerarquica && idEstructuraJerarquica>0)
    {
      console.log('items: ', this.props.data);
      const result = this.deepFilter(items, node =>
        {
          if(parseInt(node.id)==idEstructuraJerarquica)
          {
            console.log('node: ', node);
            return true;
          }
          return false;
          //parseInt(node.id)==idEstructuraJerarquica;
        });

      console.log('result: ', result);
      if(result && result.length>0 && result[0].children && result[0].children.length>0)
        this.abrirNodos(result[0]);
      const { renderKey } = this.state;
      this.setState({ renderKey: renderKey+1 });
    }
  }

  /*************************************
    Búsqueda por texto (caja búsqueda)
  *************************************/
  _onSearch= async () => {
    var items=this.props.data;
    const { filterText} = this.state;
    this.setState({ currentNode: -1 });
    this.setState({ ruta: '' });
    selectedNodes=[];
    if (!filterText) {
        this.setState({ filteredNodes: items });
        return;
    }

    const result =  this.deepFilter(items, node =>
        node.name.toLowerCase().includes(filterText.toLowerCase())
      );

    console.log('result: ', result);
    this.setState({ filteredNodes: result });
    if(result && result.length>0 && result[0].children && result[0].children.length>0)
      this.abrirNodos(result[0]);

    const { renderKey } = this.state;
    this.setState({ renderKey: renderKey+1 });
  };
  
  deepFilter=(nodes, cb) =>{
    return nodes.map(node => {
        if (cb(node)) {selectedNodes.push(node.id);return node;}
        let children = this.deepFilter(node.children || [], cb);
        return children.length && { ...node,  children };
    }).filter(Boolean);
  }

  abrirNodos = (item) => { 
    this.abrirNodo(item);
    for(let i=0;i<item.children.length;i++)
      this.abrirNodos(item.children[i]);
  }

  abrirNodo = (item) => { // eslint-disable-line
    const { data, selectType, leafCanBeSelected } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, item.id);
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      nodesStatus.set(item && item.id, true); 
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(item.id) ?
          currentNode.filter(nodeid => nodeid !== item.id) : currentNode.concat(item.id)
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: tempCurrentNode, nodesStatus };
      } else 
        return { nodesStatus };
    }, () => {/*
      const { onClick } = this.props;
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });*/
    });
  };

  _onChangeText = (key, value) => {
    this.setState({
      [key]: value
    });
  };

  selecionarItem=()=>{
    const { onClick, data } = this.props;
    const routes = this._find(data, this.state.currentNode);
    onClick && onClick({ currentNode: this.state.currentNode, routes });
  }
/*********************/
  _renderSearchBar = () => {
    const { filterText } = this.state;
    return (        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInputText}
            value={filterText}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            autoCorrect={false}
            blurOnSubmit
            clearButtonMode="while-editing"
            placeholder="Búsqueda"
            placeholderTextColor="#959595"
            onChangeText={(text) => this._onChangeText('filterText', text)}
          />
          <TouchableOpacity style={styles.searchBotonBuscar} onPress={this._onSearch}>
            <Ionicons name="ios-search" style={styles.searchIconBuscar}/>
          </TouchableOpacity>
        </View>
    );
  }
  render() {
    const { renderKey, filteredNodes, ruta } = this.state;
    return (
      <View style={styles.container}>
        <Ionicons
          name="checkmark-sharp"
          style={styles.iconAceptar}
          onPress={this.selecionarItem}
        />
        {this._renderSearchBar()}
        
        {
          ruta != "" ?
            <Text style={styles.rutaSeleccionada}>{ruta}</Text>
          : null
        }
          
        <View style={styles.scrollArbol}>
         <ScrollView nestedScrollEnabled style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <FlatList
                key={renderKey}
                keyExtractor={(item, i) => i.toString()}
                style={styles.arbol}
                onEndReachedThreshold={0.01}
                {...this.props}
                data={filteredNodes.length>0?filteredNodes: this.props.data}
                //data={this.props.data}
                //extraData={this.state}
                renderItem={this._renderRow}
              />
            </SafeAreaView>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', //'#fff',
    width: "100%",
  },
  iconAceptar: {
    position: "absolute",
    top: -30,
    right: 5,
    color: "white",
    fontSize: 32,
  },
  searchContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    //width: "100%",
    marginTop: 40,
    //marginLeft: 15,
    //marginRight: 15,
    height: 60,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 15,
    zIndex: 11,
  },
  searchInputText: {
    flex: 9,
    marginLeft: 15,
    color: "#555",
    fontStyle: "italic",
    verticalAlign: "middle",
  },
  searchBotonBuscar: {
    flex: 1,
  },
  searchIconBuscar:{
    fontSize: 25,
    paddingTop: 15,
    verticalAlign: "middle",
    textAlignVertical: "center",
  },
  
  rutaSeleccionada: { 
    fontWeight: "bold", 
    backgroundColor: "#F4D5D7",
    marginTop: 15, 
    //marginLeft: 15,
    //marginRight: 15,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,

    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 5,
  },

  scrollArbol:{
    width: "100%",
    height: ScreenHeight-230,
    marginTop: 15,
  },
  scroller:{
    flex: 1,
    //top: 0, bottom: 0,
  },
  arbol:{ 
    flex: 1,
    paddingBottom: 150,
    //top: 0, bottom: 0,
    //position: "absolute",
    //marginLeft: 15,
    //marginRight: 15,
  },
  collapseIcon: {
    width: 0,
    height: 0,
    marginRight: 2,
    //marginLeft: 5,
    borderStyle: 'solid',
  },
  textName: {
    fontSize: 14,
    marginLeft: 5
  },
});